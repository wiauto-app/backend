import { tool } from "ai";
import { searchVehiclesInputSchema } from "../schemas/search-vehicles.schema";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import { mergeSearchVehiclesInput } from "../helpers/merge-search-vehicles-input";
import {
  AssistantSearchExecutorService,
  SearchVehiclesResult,
  validateSearchVehiclesFilters,
} from "../services/assistant-search-executor.service";
import { AssistantFilterCatalogService } from "../services/assistant-filter-catalog.service";

interface CreateSearchVehiclesToolOptions {
  initialFilters?: SearchVehiclesInput;
  searchExecutor: AssistantSearchExecutorService;
  filterCatalogService: AssistantFilterCatalogService;
}

export const createSearchVehiclesTool = ({
  initialFilters,
  searchExecutor,
  filterCatalogService,
}: CreateSearchVehiclesToolOptions) =>
  tool({
    description:
      "Busca o refina vehículos activos en WiAuto con filtros estructurados. Combina los filtros iniciales del listing. Úsala SOLO para búsquedas nuevas, refinamientos, respuestas a clarificaciones o cuando el usuario pide otras opciones / ninguno le convence. NO la uses para comparar referencias (Ref. N) concretas, analizar un anuncio ya elegido, contactar al vendedor (usa prepareSellerContact) ni negociar (usa prepareNegotiation).",
    inputSchema: searchVehiclesInputSchema,
    execute: async (input): Promise<SearchVehiclesResult | { error: string }> => {
      const filters = mergeSearchVehiclesInput(initialFilters, input);
      const catalog = await filterCatalogService.getCatalog();

      try {
        validateSearchVehiclesFilters(filters, catalog, {});
        return await searchExecutor.execute(filters, catalog, {});
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Error al buscar vehículos";
        return { error: message };
      }
    },
  });
