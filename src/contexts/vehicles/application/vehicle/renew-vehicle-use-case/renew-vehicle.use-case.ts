import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  STATUS_VEHICLE,
  Vehicle,
} from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import {
  canRenewVehicle,
  computeRenewedExpiresAt,
  isVehicleExpired,
} from "../../../domain/utils/owner-vehicle-rules";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { RenewVehicleDto } from "./renew-vehicle.dto";

@Injectable()
export class RenewVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
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
        expires_at: primitive.expires_at ?? now,
        renewed_at: primitive.renewed_at ?? null,
        now,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no cumple las condiciones para renovarse",
      );
    }

    const was_expired = isVehicleExpired(primitive.expires_at ?? now, now);
    const new_expires_at = computeRenewedExpiresAt(
      primitive.expires_at ?? now,
      now,
    );

    let next_status = primitive.status ?? STATUS_VEHICLE.INACTIVE;
    if (
      was_expired &&
      next_status === STATUS_VEHICLE.INACTIVE &&
      primitive.status_change_message === null
    ) {
      next_status = STATUS_VEHICLE.ACTIVE;
    }

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      expires_at: new_expires_at,
      renewed_at: now,
      status: next_status,
    });

    await this.vehicle_repository.update(updated);

    if (next_status === STATUS_VEHICLE.ACTIVE) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_published({
        vehicle_id: dto.vehicle_id,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(dto.vehicle_id, next_status);

    return {
      expires_at: new_expires_at,
      can_renew: false,
      status: next_status,
    };
  }
}
