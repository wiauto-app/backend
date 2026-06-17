import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { VehicleListItemRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle-list-item.repository";

import { ALERT_EVENT_TYPE } from "../../domain/enums/alert-event-type.enum";
import { AlertNotificationPreferencesRepository } from "../../domain/repositories/alert-notification-preferences.repository";
import { ProcessAlertEventUseCase } from "../process-alert-event-use-case/process-alert-event.use-case";

@Injectable()
export class ProcessSavedVehicleRemindersUseCase {
  constructor(
    private readonly vehicle_list_item_repository: VehicleListItemRepository,
    private readonly preferences_repository: AlertNotificationPreferencesRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly process_alert_event_use_case: ProcessAlertEventUseCase,
  ) {}

  async execute(): Promise<void> {
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

      await this.process_alert_event_use_case.execute({
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
