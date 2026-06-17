import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { PrimitiveAlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";
import { GetNotificationPreferencesDto } from "./get-notification-preferences.dto";

@Injectable()
export class GetNotificationPreferencesUseCase {
  constructor(
    private readonly alert_notification_preferences_repository: AlertNotificationPreferencesRepository,
  ) {}

  async execute(
    dto: GetNotificationPreferencesDto,
  ): Promise<PrimitiveAlertNotificationPreferences> {
    const existing =
      await this.alert_notification_preferences_repository.findByProfileId(
        dto.profile_id,
      );

    if (existing) {
      return existing.toPrimitives();
    }

    const defaults = AlertNotificationPreferences.createDefaults(dto.profile_id);
    await this.alert_notification_preferences_repository.save(defaults);
    return defaults.toPrimitives();
  }
}
