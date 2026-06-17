import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import { AlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { PrimitiveAlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";
import { UpdateNotificationPreferencesDto } from "./update-notification-preferences.dto";

@Injectable()
export class UpdateNotificationPreferencesUseCase {
  constructor(
    private readonly alert_notification_preferences_repository: AlertNotificationPreferencesRepository,
  ) {}

  async execute(
    dto: UpdateNotificationPreferencesDto,
  ): Promise<PrimitiveAlertNotificationPreferences> {
    const {
      profile_id,
      notify_new_matches,
      notify_price_drops,
      notify_favorite_changes,
      notify_new_messages,
      notify_seller_replies,
      notify_saved_vehicle_reminders,
      saved_vehicle_reminder_days,
      frequency,
      channel_email,
      channel_push,
      channel_sms,
    } = dto;

    const has_updates = [
      notify_new_matches,
      notify_price_drops,
      notify_favorite_changes,
      notify_new_messages,
      notify_seller_replies,
      notify_saved_vehicle_reminders,
      saved_vehicle_reminder_days,
      frequency,
      channel_email,
      channel_push,
      channel_sms,
    ].some((value) => value !== undefined);

    if (!has_updates) {
      throw new ValidationException("Debes enviar al menos un campo para actualizar");
    }

    const existing =
      (await this.alert_notification_preferences_repository.findByProfileId(
        profile_id,
      )) ?? AlertNotificationPreferences.createDefaults(profile_id);

    const updated = existing.update({
      notify_new_matches,
      notify_price_drops,
      notify_favorite_changes,
      notify_new_messages,
      notify_seller_replies,
      notify_saved_vehicle_reminders,
      saved_vehicle_reminder_days,
      frequency,
      channel_email,
      channel_push,
      channel_sms,
    });

    if (
      await this.alert_notification_preferences_repository.findByProfileId(
        profile_id,
      )
    ) {
      await this.alert_notification_preferences_repository.update(updated);
    } else {
      await this.alert_notification_preferences_repository.save(updated);
    }

    return updated.toPrimitives();
  }
}
