import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { PublishedVehicleSnapshotPort } from "@/src/contexts/vehicles/ports/published-vehicle-snapshot.port";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/exceptions/vehicle-not-found.exception";

import { TypeOrmAlertRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-repository";
import { Alert, AlertWithNewMatchesCount, PrimitiveAlert } from "../types/alert";
import { AlertForbiddenException } from "../exceptions/alert-forbidden.exception";
import { AlertNotFoundException } from "../exceptions/alert-not-found.exception";
import { TypeOrmAlertNotificationEventRepository } from "@/src/contexts/alerts/repositories/typeorm.alert-notification-event.repository";
import { CreateAlertDto } from "../dto/create-alert.dto";
import { CreateAlertFromVehicleDto } from "../dto/create-alert-from-vehicle.dto";
import { DeleteAlertDto } from "../dto/delete-alert.dto";
import { FindAllAlertsDto } from "../dto/find-all-alerts.dto";
import { FindOneAlertDto } from "../dto/find-one-alert.dto";
import { MarkAlertViewedDto } from "../dto/mark-alert-viewed.dto";
import { UpdateAlertDto } from "../dto/update-alert.dto";
import {
  buildAlertFiltersFromVehicleSnapshot,
  buildDefaultAlertNameFromVehicleSnapshot,
} from "./build-alert-filters-from-vehicle-snapshot";
import { mapToAlertFilters } from "./map-alert-filters";

@Injectable()
export class AlertService {
  constructor(
    private readonly alert_repository: TypeOrmAlertRepository,
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly event_repository: TypeOrmAlertNotificationEventRepository,
    private readonly published_vehicle_snapshot_port: PublishedVehicleSnapshotPort,
  ) {}

  async create(dto: CreateAlertDto): Promise<PrimitiveAlert> {
    const profile = await this.profile_repository.findOne(dto.profile_id);
    if (!profile) {
      throw new ValidationException("Perfil de usuario no encontrado");
    }

    const profile_email = profile.user?.email?.trim();
    const email = dto.email?.trim() || profile_email;

    if (!email) {
      throw new ValidationException("El correo es obligatorio para crear una alerta");
    }

    const filters = dto.filters ?? mapToAlertFilters(dto);
    if (Object.keys(filters).length === 0) {
      throw new ValidationException("Debes definir al menos un filtro para la alerta");
    }

    const alert = Alert.create({
      name: dto.name.trim(),
      profile_id: dto.profile_id,
      email,
      phone: dto.phone.trim(),
      phone_code: dto.phone_code.trim(),
      filters,
    });

    await this.alert_repository.save(alert);
    return alert.toPrimitives();
  }

  async createFromVehicle(dto: CreateAlertFromVehicleDto): Promise<PrimitiveAlert> {
    const snapshot = await this.published_vehicle_snapshot_port.buildForVehicleId(
      dto.vehicle_id,
    );

    if (!snapshot) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const filters = buildAlertFiltersFromVehicleSnapshot(snapshot);

    const existing_by_source =
      await this.alert_repository.findByProfileIdAndSourceVehicleId(
        dto.profile_id,
        dto.vehicle_id,
      );

    if (existing_by_source) {
      throw new ValidationException(
        "Ya tienes una alerta guardada para este vehículo",
      );
    }

    const existing_by_filters = await this.alert_repository.filtersMatch(
      dto.profile_id,
      filters,
    );

    if (existing_by_filters) {
      throw new ValidationException(
        "Ya tienes una alerta guardada para este vehículo",
      );
    }

    const name =
      dto.name?.trim() ||
      buildDefaultAlertNameFromVehicleSnapshot(snapshot);

    return this.create({
      profile_id: dto.profile_id,
      name,
      email: dto.email,
      phone: dto.phone?.trim() ?? "",
      phone_code: dto.phone_code?.trim() ?? "",
      filters,
    } as CreateAlertDto);
  }

  async findAll(dto: FindAllAlertsDto): Promise<AlertWithNewMatchesCount[]> {
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

  async findOne(dto: FindOneAlertDto): Promise<PrimitiveAlert> {
    const alert = await this.alert_repository.findOne(dto.alert_id);
    if (!alert) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    if (alert.toPrimitives().profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    return alert.toPrimitives();
  }

  async update(dto: UpdateAlertDto): Promise<PrimitiveAlert> {
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

  async delete(dto: DeleteAlertDto): Promise<void> {
    const existing = await this.alert_repository.findOne(dto.alert_id);
    if (!existing) {
      throw new AlertNotFoundException(dto.alert_id);
    }

    if (existing.toPrimitives().profile_id !== dto.profile_id) {
      throw new AlertForbiddenException();
    }

    await this.alert_repository.delete(dto.alert_id);
  }

  async markViewed(dto: MarkAlertViewedDto): Promise<PrimitiveAlert> {
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
