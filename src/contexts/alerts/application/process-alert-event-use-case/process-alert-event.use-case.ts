import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  formatLocationLabel,
  formatTransmissionLabel,
  humanizeSlug,
} from "@/src/contexts/shared/mail/mail-template.format";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { PublishedVehicleSnapshotPort } from "@/src/contexts/vehicles/application/ports/published-vehicle-snapshot.port";
import { VehicleListItemRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle-list-item.repository";

import { AlertRepository } from "../../domain/alert.repository";
import { Alert } from "../../domain/entities/alert";
import { AlertNotificationEvent } from "../../domain/entities/alert-notification-event";
import { AlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { ALERT_EVENT_TYPE, type AlertEventType } from "../../domain/enums/alert-event-type.enum";
import { ALERT_NOTIFICATION_EVENT_STATUS } from "../../domain/enums/alert-notification-event-status.enum";
import { AlertNotificationEventRepository } from "../../domain/repositories/alert-notification-event.repository";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";
import { AlertNotificationDispatcher, AlertPushNotificationPort, AlertSmsNotificationPort } from "../../domain/ports/alert-notification.port";
import { vehicle_matches_alert_filters } from "../match-vehicle-alerts-use-case/alert-vehicle-matcher";
import {
  get_enabled_channels,
  is_alert_toggle_enabled,
  is_global_toggle_enabled,
} from "../utils/alert-notification-rules";
import { compute_digest_scheduled_for } from "../utils/compute-digest-scheduled-for";
import { ProcessAlertEventDto } from "./process-alert-event.dto";

type Recipient = {
  profile_id: string;
  email: string;
  alert: Alert | null;
};

@Injectable()
export class ProcessAlertEventUseCase {
  constructor(
    private readonly published_vehicle_snapshot_port: PublishedVehicleSnapshotPort,
    private readonly alert_repository: AlertRepository,
    private readonly preferences_repository: AlertNotificationPreferencesRepository,
    private readonly event_repository: AlertNotificationEventRepository,
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly alert_notification_dispatcher: AlertNotificationDispatcher,
    private readonly alert_push_port: AlertPushNotificationPort,
    private readonly alert_sms_port: AlertSmsNotificationPort,
  ) {}

  async execute(dto: ProcessAlertEventDto): Promise<void> {
    const snapshot = dto.vehicle_id
      ? await this.published_vehicle_snapshot_port.buildForVehicleId(dto.vehicle_id)
      : null;

    if (dto.vehicle_id && !snapshot) {
      return;
    }

    const recipients = await this.resolve_recipients(dto, snapshot);
    if (recipients.length === 0) {
      return;
    }

    for (const recipient of recipients) {
      await this.process_recipient(dto, recipient, snapshot);
    }
  }

  private async resolve_recipients(
    dto: ProcessAlertEventDto,
    snapshot: Awaited<
      ReturnType<PublishedVehicleSnapshotPort["buildForVehicleId"]>
    >,
  ): Promise<Recipient[]> {
    const { event_type } = dto;

    if (
      event_type === ALERT_EVENT_TYPE.NEW_MESSAGE ||
      event_type === ALERT_EVENT_TYPE.SELLER_REPLY ||
      event_type === ALERT_EVENT_TYPE.SAVED_VEHICLE_REMINDER
    ) {
      if (!dto.profile_id) {
        return [];
      }
      const email = await this.profile_user_repository.findEmailById(dto.profile_id);
      if (!email) {
        return [];
      }
      return [{ profile_id: dto.profile_id, email, alert: null }];
    }

    if (!snapshot || !dto.vehicle_id) {
      return [];
    }

    const matched_alerts = await this.find_matched_alerts(snapshot);
    const alert_recipients = matched_alerts
      .filter((alert) => is_alert_toggle_enabled(event_type, alert))
      .map((alert) => {
        const primitive = alert.toPrimitives();
        return {
          profile_id: primitive.profile_id,
          email: primitive.email,
          alert,
        };
      });

    if (
      event_type === ALERT_EVENT_TYPE.PRICE_DROP ||
      event_type === ALERT_EVENT_TYPE.SOLD_REMOVED ||
      event_type === ALERT_EVENT_TYPE.FAVORITE_CHANGE
    ) {
      const favorite_profile_ids =
        await this.vehicle_list_item_repository.findProfileIdsByVehicleId(
          dto.vehicle_id,
        );

      const recipients_map = new Map<string, Recipient>();
      for (const recipient of alert_recipients) {
        recipients_map.set(recipient.profile_id, recipient);
      }

      for (const profile_id of favorite_profile_ids) {
        if (profile_id === snapshot.profile_id) {
          continue;
        }
        if (recipients_map.has(profile_id)) {
          continue;
        }
        const email = await this.profile_user_repository.findEmailById(profile_id);
        if (!email) {
          continue;
        }
        recipients_map.set(profile_id, { profile_id, email, alert: null });
      }

      if (event_type === ALERT_EVENT_TYPE.FAVORITE_CHANGE) {
        return Array.from(recipients_map.values()).filter(
          (recipient) => recipient.alert === null,
        );
      }

      return Array.from(recipients_map.values());
    }

    return alert_recipients;
  }

  private async find_matched_alerts(
    snapshot: NonNullable<
      Awaited<ReturnType<PublishedVehicleSnapshotPort["buildForVehicleId"]>>
    >,
  ): Promise<Alert[]> {
    const candidates = await this.alert_repository.findCandidatesForPublishedVehicle({
      make_slug: snapshot.make_slug,
      model_slug: snapshot.model_slug,
      exclude_profile_id: snapshot.profile_id,
    });

    return candidates.filter((alert) => {
      const primitive = alert.toPrimitives();
      if (!primitive.is_active) {
        return false;
      }
      return vehicle_matches_alert_filters(snapshot, primitive.filters);
    });
  }

  private async process_recipient(
    dto: ProcessAlertEventDto,
    recipient: Recipient,
    snapshot: Awaited<
      ReturnType<PublishedVehicleSnapshotPort["buildForVehicleId"]>
    >,
  ): Promise<void> {
    const preferences = await this.load_preferences(recipient.profile_id);
    const preferences_primitive = preferences.toPrimitives();

    if (!is_global_toggle_enabled(dto.event_type, preferences_primitive)) {
      return;
    }

    if (recipient.alert && !recipient.alert.toPrimitives().is_active) {
      return;
    }

    const channels = get_enabled_channels(preferences_primitive);
    if (channels.length === 0) {
      return;
    }

    const alert_id = recipient.alert?.toPrimitives().id ?? null;
    const vehicle_id = dto.vehicle_id ?? null;

    if (alert_id && vehicle_id) {
      const duplicate = await this.event_repository.findDuplicate({
        alert_id,
        vehicle_id,
        event_type: dto.event_type,
      });
      if (duplicate) {
        return;
      }
    }

    const notification_payload = this.build_notification_payload(
      dto,
      recipient,
      snapshot,
    );

    const event = AlertNotificationEvent.create({
      profile_id: recipient.profile_id,
      alert_id,
      vehicle_id,
      event_type: dto.event_type,
      channel: "email",
      status: ALERT_NOTIFICATION_EVENT_STATUS.PENDING,
      scheduled_for: compute_digest_scheduled_for(preferences_primitive.frequency),
      payload: notification_payload,
    });

    await this.event_repository.save(event);

    if (preferences_primitive.frequency !== "instant") {
      return;
    }

    for (const channel of channels) {
      const event_notification = {
        to: recipient.email,
        event_type: dto.event_type,
        channel,
        payload: notification_payload,
      };

      if (channel === "email") {
        await this.alert_notification_dispatcher.notifyEvent(event_notification);
      } else if (channel === "push") {
        await this.alert_push_port.notify(event_notification);
      } else {
        await this.alert_sms_port.notify(event_notification);
      }
    }

    await this.event_repository.update(event.markSent());

    if (
      recipient.alert &&
      (dto.event_type === ALERT_EVENT_TYPE.NEW_LISTING ||
        dto.event_type === ALERT_EVENT_TYPE.FEATURED)
    ) {
      await this.alert_repository.update(
        recipient.alert.update({ last_sent_at: new Date() }),
      );
    }
  }

  private async load_preferences(
    profile_id: string,
  ): Promise<AlertNotificationPreferences> {
    const existing = await this.preferences_repository.findByProfileId(profile_id);
    if (existing) {
      return existing;
    }

    const defaults = AlertNotificationPreferences.createDefaults(profile_id);
    await this.preferences_repository.save(defaults);
    return defaults;
  }

  private build_notification_payload(
    dto: ProcessAlertEventDto,
    recipient: Recipient,
    snapshot: Awaited<
      ReturnType<PublishedVehicleSnapshotPort["buildForVehicleId"]>
    >,
  ): Record<string, unknown> {
    const base: Record<string, unknown> = {
      event_type: dto.event_type,
      profile_id: recipient.profile_id,
      alert_id: recipient.alert?.toPrimitives().id ?? null,
      alert_name: recipient.alert?.toPrimitives().name ?? null,
      ...dto.metadata,
    };

    if (!snapshot || !dto.vehicle_id) {
      return base;
    }

    return {
      ...base,
      vehicle_id: snapshot.vehicle_id,
      vehicle_title: snapshot.vehicle_label,
      vehicle_price:
        typeof dto.metadata?.new_price === "number"
          ? dto.metadata.new_price
          : typeof dto.metadata?.vehicle_price === "number"
            ? dto.metadata.vehicle_price
            : snapshot.price,
      previous_price: dto.metadata?.previous_price,
      vehicle_image_url: snapshot.cover_image_url,
      vehicle_year: snapshot.year,
      vehicle_mileage: snapshot.mileage,
      vehicle_fuel_label: humanizeSlug(snapshot.fuel_type_slug),
      vehicle_transmission_label: formatTransmissionLabel(snapshot.transmission_type),
      vehicle_location_label: formatLocationLabel(
        snapshot.municipalities_slugs,
        snapshot.province_slugs,
      ),
    };
  }
}
