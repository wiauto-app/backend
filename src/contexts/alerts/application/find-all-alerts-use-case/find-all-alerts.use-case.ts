import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertWithNewMatchesCount } from "../../domain/entities/alert";
import { AlertNotificationEventRepository } from "../../domain/repositories/alert-notification-event.repository";
import { FindAllAlertsDto } from "./find-all-alerts.dto";

@Injectable()
export class FindAllAlertsUseCase {
  constructor(
    private readonly alert_repository: AlertRepository,
    private readonly event_repository: AlertNotificationEventRepository,
  ) {}

  async execute(dto: FindAllAlertsDto): Promise<AlertWithNewMatchesCount[]> {
    const alerts = await this.alert_repository.findAllByProfileId(dto.profile_id);

    return Promise.all(
      alerts.map(async (alert) => {
        const primitive = alert.toPrimitives();
        const since = primitive.last_viewed_at ?? primitive.created_at;
        const new_matches_count = await this.event_repository.countNewListingsSince({
          alert_id: primitive.id,
          since,
        });

        return {
          ...primitive,
          new_matches_count,
        };
      }),
    );
  }
}
