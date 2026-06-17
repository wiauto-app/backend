import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import { AlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { PrimitiveAlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";
import type { AlertNotificationFrequency } from "../../domain/enums/alert-notification-frequency.enum";

export class UpdateAlertNotificationPreferencesDto {
  profile_id: string;
  notify_new_matches?: boolean;
  notify_price_drops?: boolean;
  notify_favorite_changes?: boolean;
  notify_new_messages?: boolean;
  notify_seller_replies?: boolean;
  notify_saved_vehicle_reminders?: boolean;
  saved_vehicle_reminder_days?: number;
  frequency?: AlertNotificationFrequency;
  channel_email?: boolean;
  channel_push?: boolean;
  channel_sms?: boolean;
}

@Injectable()
export class UpdateAlertNotificationPreferencesUseCase {
  constructor(
    private readonly preferences_repository: AlertNotificationPreferencesRepository,
  ) {}

  async execute(
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
}
