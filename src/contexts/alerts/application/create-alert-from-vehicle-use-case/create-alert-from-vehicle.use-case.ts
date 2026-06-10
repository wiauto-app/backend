import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ValidationException } from "@/src/contexts/shared/exceptions/validation.exception";
import { PublishedVehicleSnapshotPort } from "@/src/contexts/vehicles/application/ports/published-vehicle-snapshot.port";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";

import { AlertRepository } from "../../domain/alert.repository";
import { PrimitiveAlert } from "../../domain/entities/alert";
import {
  buildAlertFiltersFromVehicleSnapshot,
  buildDefaultAlertNameFromVehicleSnapshot,
} from "../mappers/build-alert-filters-from-vehicle-snapshot";
import { CreateAlertDto } from "../create-alert-use-case/create-alert.dto";
import { CreateAlertUseCase } from "../create-alert-use-case/create-alert.use-case";
import { CreateAlertFromVehicleDto } from "./create-alert-from-vehicle.dto";

@Injectable()
export class CreateAlertFromVehicleUseCase {
  constructor(
    private readonly published_vehicle_snapshot_port: PublishedVehicleSnapshotPort,
    private readonly alert_repository: AlertRepository,
    private readonly create_alert_use_case: CreateAlertUseCase,
  ) {}

  async execute(dto: CreateAlertFromVehicleDto): Promise<PrimitiveAlert> {
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

    const create_dto = {
      profile_id: dto.profile_id,
      name,
      email: dto.email,
      phone: dto.phone?.trim() ?? "",
      phone_code: dto.phone_code?.trim() ?? "",
      filters,
    } as CreateAlertDto;

    return this.create_alert_use_case.execute(create_dto);
  }
}
