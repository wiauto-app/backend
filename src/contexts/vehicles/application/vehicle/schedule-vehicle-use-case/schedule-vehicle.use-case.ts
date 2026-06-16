import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { STATUS_VEHICLE, Vehicle } from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import {
  canScheduleVehicle,
  SCHEDULE_MAX_FUTURE_MS,
} from "../../../domain/utils/owner-vehicle-rules";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { ScheduleVehicleDto } from "./schedule-vehicle.dto";

@Injectable()
export class ScheduleVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {}

  async execute(dto: ScheduleVehicleDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing.toPrimitives();
    const now = new Date();
    const scheduled_at = dto.scheduled_publish_at;

    if (scheduled_at.getTime() <= now.getTime()) {
      throw new BadRequestException(
        "La fecha de publicación debe ser futura",
      );
    }

    if (scheduled_at.getTime() > now.getTime() + SCHEDULE_MAX_FUTURE_MS) {
      throw new BadRequestException(
        "La fecha de publicación no puede superar los 90 días",
      );
    }

    if (!canScheduleVehicle(primitive.status ?? STATUS_VEHICLE.PENDING)) {
      throw new BadRequestException(
        "Este anuncio no se puede programar en su estado actual",
      );
    }

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      scheduled_publish_at: scheduled_at,
      status: STATUS_VEHICLE.INACTIVE,
    });

    await this.vehicle_repository.update(updated);
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      STATUS_VEHICLE.INACTIVE,
    );

    return {
      scheduled_publish_at: scheduled_at,
      status: STATUS_VEHICLE.INACTIVE,
    };
  }
}
