import { Injectable, Logger } from "@nestjs/common";

import { STATUS_VEHICLE } from "../../../domain/entities/vehicle";
import { IndexVehicleSearchDocUseCase } from "../../application/index-vehicle-search-doc.use-case";
import { HeroSearchRepository } from "../../domain/ports/hero-search.repository";

@Injectable()
export class VehicleSearchIndexer {
  private readonly logger = new Logger(VehicleSearchIndexer.name);

  constructor(
    private readonly index_vehicle_search_doc_use_case: IndexVehicleSearchDocUseCase,
    private readonly hero_search_repository: HeroSearchRepository,
  ) {}

  async indexVehicle(vehicle_id: string): Promise<void> {
    try {
      await this.index_vehicle_search_doc_use_case.execute(vehicle_id);
    } catch (error) {
      this.logger.error(
        `Failed to index vehicle ${vehicle_id} in OpenSearch`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async deleteVehicle(vehicle_id: string): Promise<void> {
    try {
      await this.hero_search_repository.deleteDocument(vehicle_id);
    } catch (error) {
      this.logger.error(
        `Failed to delete vehicle ${vehicle_id} from OpenSearch`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async syncVehicle(vehicle_id: string, status?: string): Promise<void> {
    if (status && status !== STATUS_VEHICLE.ACTIVE) {
      await this.deleteVehicle(vehicle_id);
      return;
    }

    await this.indexVehicle(vehicle_id);
  }
}
