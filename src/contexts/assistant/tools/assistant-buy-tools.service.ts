import { Injectable } from "@nestjs/common";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import { AssistantFilterCatalogService } from "../services/assistant-filter-catalog.service";
import { AssistantSearchExecutorService } from "../services/assistant-search-executor.service";
import { createAskClarifyingQuestionsTool } from "./ask-clarifying-questions.tool";
import { createSearchVehiclesTool } from "./search-vehicles.tool";
import { createCompareVehiclesTool } from "./compare-vehicles.tool";
import { createAnalyzeListingTool } from "./analyze-listing.tool";
import { createPrepareSellerContactTool } from "./prepare-seller-contact.tool";
import { createPrepareNegotiationTool } from "./prepare-negotiation.tool";

interface CreateBuyAssistantToolsOptions {
  initialFilters?: SearchVehiclesInput;
}

@Injectable()
export class AssistantBuyToolsService {
  constructor(
    private readonly searchExecutor: AssistantSearchExecutorService,
    private readonly filterCatalogService: AssistantFilterCatalogService,
    private readonly vehicleService: VehicleService,
  ) {}

  createBuyAssistantTools({ initialFilters }: CreateBuyAssistantToolsOptions) {
    return {
      askClarifyingQuestions: createAskClarifyingQuestionsTool({
        initialFilters,
      }),
      searchVehicles: createSearchVehiclesTool({
        initialFilters,
        searchExecutor: this.searchExecutor,
        filterCatalogService: this.filterCatalogService,
      }),
      compareVehicles: createCompareVehiclesTool({
        vehicleService: this.vehicleService,
      }),
      analyzeListing: createAnalyzeListingTool({
        vehicleService: this.vehicleService,
      }),
      prepareSellerContact: createPrepareSellerContactTool({
        vehicleService: this.vehicleService,
      }),
      prepareNegotiation: createPrepareNegotiationTool({
        vehicleService: this.vehicleService,
      }),
    };
  }
}
