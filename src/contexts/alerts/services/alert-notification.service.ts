import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import {
  formatLocationLabel,
  formatTransmissionLabel,
  humanizeSlug,
} from "@/src/contexts/shared/mail/mail-template.format";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";
import { PublishedVehicleSnapshotPort } from "@/src/contexts/vehicles/ports/published-vehicle-snapshot.port";
import { TypeOrmVehicleListItemRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-list-item-repository";

import { TypeOrmAlertRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-repository";
import { Alert } from "../types/alert";
import { AlertNotificationEvent } from "../types/alert-notification-event";
import {
  AlertNotificationPreferences,
  PrimitiveAlertNotificationPreferences,
} from "../types/alert-notification-preferences";
import { ALERT_EVENT_TYPE } from "../types/alert-event-type.enum";
import { ALERT_NOTIFICATION_EVENT_STATUS } from "../types/alert-notification-event-status.enum";
import { TypeOrmAlertNotificationEventRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-notification-event.repository";
import { TypeOrmAlertNotificationPreferencesRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-notification-preferences.repository";
import { AlertNotificationDispatcher } from "../ports/alert-notification.port";
import { GetAlertNotificationPreferencesDto } from "../dto/get-alert-notification-preferences.dto";
import { MatchVehicleAlertsDto } from "../dto/match-vehicle-alerts.dto";
import { ProcessAlertEventDto } from "../dto/process-alert-event.dto";
import { SendAlertDigestDto } from "../dto/send-alert-digest.dto";
import { UpdateAlertNotificationPreferencesDto } from "../dto/update-alert-notification-preferences.dto";
import { vehicle_matches_alert_filters } from "./alert-vehicle-matcher";
import {
  is_alert_toggle_enabled,
  is_global_toggle_enabled,
  get_enabled_channels,
} from "./alert-notification-rules";
import { compute_digest_scheduled_for } from "./compute-digest-scheduled-for";
import { NotificationChannelDispatcher } from "./notification-channel-dispatcher.service";

interface Recipient {
  profile_id: string;
  email: string;
  alert: Alert | null;
}

@Injectable()
export class AlertNotificationService {
  constructor(
    private readonly published_vehicle_snapshot_port: PublishedVehicleSnapshotPort,
    private readonly alert_repository: TypeOrmAlertRepository,
    private readonly preferences_repository: TypeOrmAlertNotificationPreferencesRepository,
    private readonly event_repository: TypeOrmAlertNotificationEventRepository,
    private readonly vehicle_list_item_repository: TypeOrmVehicleListItemRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly alert_notification_dispatcher: AlertNotificationDispatcher,
    private readonly notification_channel_dispatcher: NotificationChannelDispatcher,
  ) {}

  async processEvent(dto: ProcessAlertEventDto): Promise<void> {
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
    const { title, body } = this.build_title_and_body(
      dto.event_type,
      notification_payload,
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

    await this.notification_channel_dispatcher.notify({
      profile_id: recipient.profile_id,
      category: dto.event_type,
      title,
      body,
      data: notification_payload,
      email_override: recipient.email,
    });

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

  private build_title_and_body(
    event_type: ProcessAlertEventDto["event_type"],
    payload: Record<string, unknown>,
  ): { title: string; body: string } {
    const vehicle_title =
      typeof payload.vehicle_title === "string"
        ? payload.vehicle_title
        : "WiAuto";

    const previous_price = payload.previous_price;
    const new_price = payload.vehicle_price;

    if (
      event_type === ALERT_EVENT_TYPE.PRICE_DROP &&
      typeof previous_price === "number" &&
      typeof new_price === "number"
    ) {
      return {
        title: `Bajada de precio: ${vehicle_title}`,
        body: `El precio bajó de ${previous_price} € a ${new_price} €`,
      };
    }

    if (event_type === ALERT_EVENT_TYPE.SOLD_REMOVED) {
      return {
        title: `Anuncio no disponible: ${vehicle_title}`,
        body: "El anuncio ya no está disponible",
      };
    }

    if (event_type === ALERT_EVENT_TYPE.NEW_MESSAGE) {
      return {
        title: "Nuevo mensaje",
        body: "Tienes un nuevo mensaje",
      };
    }

    if (event_type === ALERT_EVENT_TYPE.SELLER_REPLY) {
      return {
        title: "Respuesta del vendedor",
        body: "El vendedor respondió a tu mensaje",
      };
    }

    if (event_type === ALERT_EVENT_TYPE.SAVED_VEHICLE_REMINDER) {
      return {
        title: "Recordatorio de vehículo guardado",
        body: "Tienes un vehículo guardado sin revisar",
      };
    }

    if (event_type === ALERT_EVENT_TYPE.FEATURED) {
      return {
        title: `Destacado: ${vehicle_title}`,
        body: `Novedad sobre ${vehicle_title}`,
      };
    }

    return {
      title: vehicle_title,
      body: `Novedad sobre ${vehicle_title}`,
    };
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

  async getPreferences(
    dto: GetAlertNotificationPreferencesDto,
  ): Promise<PrimitiveAlertNotificationPreferences> {
    const existing = await this.preferences_repository.findByProfileId(
      dto.profile_id,
    );

    if (existing) {
      return existing.toPrimitives();
    }

    const defaults = AlertNotificationPreferences.createDefaults(dto.profile_id);
    await this.preferences_repository.save(defaults);
    return defaults.toPrimitives();
  }

  async updatePreferences(
    dto: UpdateAlertNotificationPreferencesDto,
  ): Promise<PrimitiveAlertNotificationPreferences> {
    const { profile_id, ...updates } = dto;
    const has_updates = Object.values(updates).some((value) => value !== undefined);

    if (!has_updates) {
      throw new ValidationException("Debes enviar al menos un campo para actualizar");
    }

    let preferences = await this.preferences_repository.findByProfileId(profile_id);
    if (!preferences) {
      preferences = AlertNotificationPreferences.createDefaults(profile_id);
      await this.preferences_repository.save(preferences);
    }

    preferences = preferences.update(updates);
    await this.preferences_repository.update(preferences);
    return preferences.toPrimitives();
  }

  async matchVehicle(dto: MatchVehicleAlertsDto): Promise<void> {
    await this.processEvent({
      vehicle_id: dto.vehicle_id,
      event_type: ALERT_EVENT_TYPE.NEW_LISTING,
    });
  }

  async sendDigest(dto: SendAlertDigestDto): Promise<void> {
    const pending_events = await this.event_repository.findPendingForDigest({
      frequency: dto.frequency,
      before: new Date(),
    });

    if (pending_events.length === 0) {
      return;
    }

    const grouped = new Map<string, typeof pending_events>();
    for (const event of pending_events) {
      const profile_id = event.toPrimitives().profile_id;
      const current = grouped.get(profile_id) ?? [];
      current.push(event);
      grouped.set(profile_id, current);
    }

    for (const [profile_id, events] of grouped.entries()) {
      const email = await this.profile_user_repository.findEmailById(profile_id);
      if (!email) {
        continue;
      }

      await this.alert_notification_dispatcher.notifyDigest({
        to: email,
        frequency: dto.frequency,
        events: events.map((event) => {
          const primitive = event.toPrimitives();
          return {
            event_type: primitive.event_type,
            payload: primitive.payload,
          };
        }),
      });

      for (const event of events) {
        await this.event_repository.update(event.markSent());
      }
    }
  }

  async processSavedVehicleReminders(): Promise<void> {
    const stale_items =
      await this.vehicle_list_item_repository.findStaleFavoriteReminders({
        older_than_days: 7,
      });

    for (const item of stale_items) {
      const prefs = await this.preferences_repository.findByProfileId(
        item.profile_id,
      );
      const reminder_days = prefs?.toPrimitives().saved_vehicle_reminder_days ?? 7;

      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - reminder_days);
      if (item.added_at > cutoff) {
        continue;
      }

      const email = await this.profile_user_repository.findEmailById(item.profile_id);
      if (!email) {
        continue;
      }

      await this.processEvent({
        event_type: ALERT_EVENT_TYPE.SAVED_VEHICLE_REMINDER,
        profile_id: item.profile_id,
        vehicle_id: item.vehicle_id,
        metadata: {
          added_at: item.added_at.toISOString(),
        },
      });
    }
  }
}
