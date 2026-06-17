import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertForbiddenException } from "../../domain/exceptions/alert-forbidden.exception";
import { AlertNotFoundException } from "../../domain/exceptions/alert-not-found.exception";
import { PrimitiveAlert } from "../../domain/entities/alert";

export class MarkAlertViewedDto {
  alert_id: string;
  profile_id: string;
}

@Injectable()
export class MarkAlertViewedUseCase {
  constructor(private readonly alert_repository: AlertRepository) {}

  async execute(dto: MarkAlertViewedDto): Promise<PrimitiveAlert> {
    const existing = await this.alert_repository.findOne(dto.alert_id);
    if (!existing) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    const primitive = existing.toPrimitives();
    if (primitive.profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    const updated = existing.update({ last_viewed_at: new Date() });
    await this.alert_repository.update(updated);
    return updated.toPrimitives();
  }
}
