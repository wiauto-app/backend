import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { STATUS_VEHICLE } from "../../../domain/entities/vehicle";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { DuplicateVehicleDto } from "./duplicate-vehicle.dto";

@Injectable()
export class DuplicateVehicleUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {}

  async execute(dto: DuplicateVehicleDto): Promise<{ vehicle_id: string }> {
    const vehicle_id = await this.vehicle_repository.duplicate(dto.vehicle_id);
    await this.vehicle_search_indexer.syncVehicle(
      vehicle_id,
      STATUS_VEHICLE.PENDING,
    );
    return { vehicle_id };
  }
}
