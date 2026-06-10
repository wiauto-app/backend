import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";

import { AlertRepository } from "../../domain/alert.repository";
import { AlertForbiddenException } from "../../domain/exceptions/alert-forbidden.exception";
import { AlertNotFoundException } from "../../domain/exceptions/alert-not-found.exception";
import { PrimitiveAlert } from "../../domain/entities/alert";
import { mapToAlertFilters } from "../mappers/map-alert-filters";
import { UpdateAlertDto } from "./update-alert.dto";

@Injectable()
export class UpdateAlertUseCase {
  constructor(private readonly alert_repository: AlertRepository) {}

  async execute(dto: UpdateAlertDto): Promise<PrimitiveAlert> {
    const existing = await this.alert_repository.findOne(dto.alert_id);
    if (!existing) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    const primitive = existing.toPrimitives();
    if (primitive.profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    const mapped_filters = mapToAlertFilters(dto);
    const has_filter_updates = Object.keys(mapped_filters).length > 0;

    if (dto.name === undefined && !has_filter_updates) {
      throw new ValidationException("Debes enviar al menos un campo para actualizar");
    }

    const updated = existing.update({
      name: dto.name?.trim(),
      filters: has_filter_updates
        ? { ...primitive.filters, ...mapped_filters }
        : undefined,
    });

    await this.alert_repository.update(updated);
    return updated.toPrimitives();
  }
}
