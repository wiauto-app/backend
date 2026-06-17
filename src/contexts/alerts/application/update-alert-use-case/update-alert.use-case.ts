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
    const has_preference_updates =
      dto.is_active !== undefined ||
      dto.notify_new_listings !== undefined ||
      dto.notify_price_drops !== undefined ||
      dto.notify_sold_removed !== undefined ||
      dto.notify_featured !== undefined ||
      dto.notify_recently_updated !== undefined;

    if (dto.name === undefined && !has_filter_updates && !has_preference_updates) {
      throw new ValidationException("Debes enviar al menos un campo para actualizar");
    }

    const updated = existing.update({
      name: dto.name?.trim(),
      filters: has_filter_updates
        ? { ...primitive.filters, ...mapped_filters }
        : undefined,
      is_active: dto.is_active,
      notify_new_listings: dto.notify_new_listings,
      notify_price_drops: dto.notify_price_drops,
      notify_sold_removed: dto.notify_sold_removed,
      notify_featured: dto.notify_featured,
      notify_recently_updated: dto.notify_recently_updated,
    });

    await this.alert_repository.update(updated);
    return updated.toPrimitives();
  }
}
