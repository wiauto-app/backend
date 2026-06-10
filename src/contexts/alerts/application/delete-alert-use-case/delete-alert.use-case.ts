import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertForbiddenException } from "../../domain/exceptions/alert-forbidden.exception";
import { AlertNotFoundException } from "../../domain/exceptions/alert-not-found.exception";
import { DeleteAlertDto } from "./delete-alert.dto";

@Injectable()
export class DeleteAlertUseCase {
  constructor(private readonly alert_repository: AlertRepository) {}

  async execute(dto: DeleteAlertDto): Promise<void> {
    const existing = await this.alert_repository.findOne(dto.alert_id);
    if (!existing) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    if (existing.toPrimitives().profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    await this.alert_repository.delete(dto.alert_id);
  }
}
