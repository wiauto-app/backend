import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { PrimitiveAlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";

export class GetAlertNotificationPreferencesDto {
  profile_id: string;
}

@Injectable()
export class GetAlertNotificationPreferencesUseCase {
  constructor(
    private readonly preferences_repository: AlertNotificationPreferencesRepository,
  ) {}

  async execute(
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
}
