import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertForbiddenException } from "../../domain/exceptions/alert-forbidden.exception";
import { AlertNotFoundException } from "../../domain/exceptions/alert-not-found.exception";
import { PrimitiveAlert } from "../../domain/entities/alert";
import { FindOneAlertDto } from "./find-one-alert.dto";

@Injectable()
export class FindOneAlertUseCase {
  constructor(private readonly alert_repository: AlertRepository) {}

  async execute(dto: FindOneAlertDto): Promise<PrimitiveAlert> {
    const alert = await this.alert_repository.findOne(dto.alert_id);
    if (!alert) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    if (alert.toPrimitives().profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    return alert.toPrimitives();
  }
}
