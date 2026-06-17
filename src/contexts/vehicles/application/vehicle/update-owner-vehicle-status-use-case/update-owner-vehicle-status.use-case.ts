import { BadRequestException } from "@nestjs/common";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/domain/enums/alert-event-type.enum";

import {
  STATUS_VEHICLE,
  Vehicle,
} from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { canOwnerReactivate } from "../../../domain/utils/owner-vehicle-rules";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { UpdateOwnerVehicleStatusDto } from "./update-owner-vehicle-status.dto";

@Injectable()
export class UpdateOwnerVehicleStatusUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
  ) {}

  async execute(dto: UpdateOwnerVehicleStatusDto) {
    const existing = await this.vehicle_repository.findById(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const primitive = existing.toPrimitives();
    const current_status = primitive.status ?? STATUS_VEHICLE.PENDING;

    if (current_status === dto.status) {
      return { status: current_status };
    }

    if (dto.status === STATUS_VEHICLE.INACTIVE) {
      if (current_status !== STATUS_VEHICLE.ACTIVE) {
        throw new BadRequestException(
          "Solo puedes pausar anuncios activos",
        );
      }

      const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
        status: STATUS_VEHICLE.INACTIVE,
        status_change_message: null,
      });
      await this.vehicle_repository.update(updated);
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.SOLD_REMOVED,
      });
      await this.vehicle_search_indexer.syncVehicle(
        dto.vehicle_id,
        STATUS_VEHICLE.INACTIVE,
      );
      return { status: STATUS_VEHICLE.INACTIVE };
    }

    if (current_status !== STATUS_VEHICLE.INACTIVE) {
      throw new BadRequestException(
        "Solo puedes reactivar anuncios inactivos",
      );
    }

    if (
      !canOwnerReactivate({
        status: current_status,
        status_change_message: primitive.status_change_message ?? null,
        scheduled_publish_at: primitive.scheduled_publish_at ?? null,
      })
    ) {
      throw new BadRequestException(
        "Este anuncio no se puede reactivar desde aquí",
      );
    }

    const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
      status: STATUS_VEHICLE.ACTIVE,
      status_change_message: null,
    });
    await this.vehicle_repository.update(updated);
    await this.alert_processing_enqueue_service.enqueue_vehicle_event({
      vehicle_id: dto.vehicle_id,
      event_type: ALERT_EVENT_TYPE.NEW_LISTING,
    });
    await this.vehicle_search_indexer.syncVehicle(
      dto.vehicle_id,
      STATUS_VEHICLE.ACTIVE,
    );

    return { status: STATUS_VEHICLE.ACTIVE };
  }
}
