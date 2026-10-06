import { Injectable } from "@nestjs/common";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import type { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantFilterCatalogService } from "../services/assistant-filter-catalog.service";
import { AssistantEntityResolverService } from "../services/assistant-entity-resolver.service";
import { AssistantSearchExecutorService } from "../services/assistant-search-executor.service";
import { createAskClarifyingQuestionsTool } from "./ask-clarifying-questions.tool";
import { createSearchVehiclesTool } from "./search-vehicles.tool";
import { createCompareVehiclesTool } from "./compare-vehicles.tool";
import { createAnalyzeListingTool } from "./analyze-listing.tool";
import { createPrepareSellerContactTool } from "./prepare-seller-contact.tool";
import { createPrepareNegotiationTool } from "./prepare-negotiation.tool";

interface CreateBuyAssistantToolsOptions {
  initialFilters?: SearchVehiclesInput;
  catalog: AssistantFilterCatalog;
  /** Usuario que chatea: no se le dan canales de contacto de sus propios anuncios. */
  userId?: string;
}

@Injectable()
export class AssistantBuyToolsService {
  constructor(
    private readonly searchExecutor: AssistantSearchExecutorService,
    private readonly filterCatalogService: AssistantFilterCatalogService,
    private readonly vehicleService: VehicleService,
    private readonly entityResolver: AssistantEntityResolverService,
  ) {}

  createBuyAssistantTools({
    initialFilters,
    catalog,
    userId,
  }: CreateBuyAssistantToolsOptions) {
    return {
      askClarifyingQuestions: createAskClarifyingQuestionsTool({
        initialFilters,
        catalog,
      }),
      searchVehicles: createSearchVehiclesTool({
        initialFilters,
        searchExecutor: this.searchExecutor,
        filterCatalogService: this.filterCatalogService,
        entityResolver: this.entityResolver,
      }),
      compareVehicles: createCompareVehiclesTool({
        vehicleService: this.vehicleService,
      }),
      analyzeListing: createAnalyzeListingTool({
        vehicleService: this.vehicleService,
      }),
      prepareSellerContact: createPrepareSellerContactTool({
        vehicleService: this.vehicleService,
        userId,
      }),
      prepareNegotiation: createPrepareNegotiationTool({
        vehicleService: this.vehicleService,
      }),
    };
  }
}
