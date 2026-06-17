import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ALERT_EVENT_TYPE } from "../../domain/enums/alert-event-type.enum";
import { ProcessAlertEventUseCase } from "../process-alert-event-use-case/process-alert-event.use-case";
import { MatchVehicleAlertsDto } from "./match-vehicle-alerts.dto";

@Injectable()
export class MatchVehicleAlertsUseCase {
  constructor(
    private readonly process_alert_event_use_case: ProcessAlertEventUseCase,
  ) {}

  async execute(dto: MatchVehicleAlertsDto): Promise<void> {
    await this.process_alert_event_use_case.execute({
      vehicle_id: dto.vehicle_id,
      event_type: ALERT_EVENT_TYPE.NEW_LISTING,
    });
  }
}
