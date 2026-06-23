import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  STATUS_VEHICLE,
  Vehicle,
} from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { canRenewVehicle } from "../../../domain/utils/owner-vehicle-rules";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { RenewVehicleDto } from "./renew-vehicle.dto";

@Injectable()
export class RenewVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {}

  async execute(dto: RenewVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing.toPrimitives();
    const now = new Date();

    if (
      !canRenewVehicle({
        status: primitive.status ?? STATUS_VEHICLE.PENDING,
        renewed_at: primitive.renewed_at ?? null,
        now,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no cumple las condiciones para renovarse",
      );
    }

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      renewed_at: now,
    });

    await this.vehicle_repository.update(updated);
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      primitive.status,
    );

    return {
      renewed_at: now,
      can_renew: false,
    };
  }
}
