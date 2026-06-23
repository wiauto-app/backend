import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Vehicle } from "../../../domain/entities/vehicle";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";

@Injectable()
export class ExpireFeaturedVehiclesUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {}

  async execute(): Promise<{ processed: number }> {
    const now = new Date();
    const vehicles = await this.vehicle_repository.findExpiredFeatured(now);
    let processed = 0;

    for (const vehicle of vehicles) {
      const primitive = vehicle.toPrimitives();
      const updated = Vehicle.fromPrimitives(primitive).applyUpdates({
        is_featured: false,
        featured_expires_at: null,
      });

      await this.vehicle_repository.update(updated);
      await this.vehicle_search_indexer.syncVehicle(
        primitive.id,
        primitive.status,
      );
      processed += 1;
    }

    return { processed };
  }
}
