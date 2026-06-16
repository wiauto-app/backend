import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";

import { STATUS_VEHICLE, Vehicle } from "../../../domain/entities/vehicle";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";

@Injectable()
export class ProcessScheduledVehiclePublishUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
  ) {}

  async execute(): Promise<{ processed: number }> {
    const now = new Date();
    const vehicles = await this.vehicle_repository.findScheduledForPublish(now);
    let processed = 0;

    for (const vehicle of vehicles) {
      const primitive = vehicle.toPrimitives();
      const profile_id = primitive.profile_id;
      if (!profile_id) {
        continue;
      }

      const has_approved_before =
        await this.vehicle_repository.profileHasApprovedAdsBefore(
          profile_id,
          primitive.id,
        );

      const next_status = has_approved_before
        ? STATUS_VEHICLE.ACTIVE
        : STATUS_VEHICLE.PENDING;

      const updated = vehicle.applyUpdates({
        status: next_status,
        scheduled_publish_at: null,
        status_change_message: null,
      });

      await this.vehicle_repository.update(updated);

      if (next_status === STATUS_VEHICLE.ACTIVE) {
        await this.alert_processing_enqueue_service.enqueue_vehicle_published({
          vehicle_id: primitive.id,
        });
      }

      await this.vehicle_search_indexer.syncVehicle(primitive.id, next_status);
      processed += 1;
    }

    return { processed };
  }
}
