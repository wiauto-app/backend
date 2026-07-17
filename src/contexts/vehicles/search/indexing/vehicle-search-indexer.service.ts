import { Injectable, Logger } from "@nestjs/common";

import { STATUS_VEHICLE } from "../../types/vehicle";
import { IndexVehicleSearchDocService } from "../services/index-vehicle-search-doc.service";
import { OpenSearchHeroSearchRepository } from "@/src/contexts/vehicles/search/clients/opensearch/opensearch-hero-search.repository";

@Injectable()
export class VehicleSearchIndexer {
  private readonly logger = new Logger(VehicleSearchIndexer.name);

  constructor(
    private readonly index_vehicle_search_doc_service: IndexVehicleSearchDocService,
    private readonly hero_search_repository: OpenSearchHeroSearchRepository,
  ) {}

  async indexVehicle(vehicle_id: string): Promise<void> {
    try {
      await this.index_vehicle_search_doc_service.execute(vehicle_id);
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
