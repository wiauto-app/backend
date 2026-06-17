import { AlertNotificationPreferences } from "../entities/alert-notification-preferences";

export abstract class AlertNotificationPreferencesRepository {
  abstract findByProfileId(
    profile_id: string,
  ): Promise<AlertNotificationPreferences | null>;
  abstract save(preferences: AlertNotificationPreferences): Promise<void>;
  abstract update(preferences: AlertNotificationPreferences): Promise<void>;
}
