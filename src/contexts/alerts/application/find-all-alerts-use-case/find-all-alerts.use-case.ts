import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertRepository } from "../../domain/alert.repository";
import { PrimitiveAlert } from "../../domain/entities/alert";
import { FindAllAlertsDto } from "./find-all-alerts.dto";

@Injectable()
export class FindAllAlertsUseCase {
  constructor(private readonly alert_repository: AlertRepository) {}

  async execute(dto: FindAllAlertsDto): Promise<PrimitiveAlert[]> {
    const alerts = await this.alert_repository.findAllByProfileId(dto.profile_id);
    return alerts.map((alert) => alert.toPrimitives());
  }
}
