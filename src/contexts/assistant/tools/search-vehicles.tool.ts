import { tool } from "ai";
import { searchVehiclesInputSchema } from "../schemas/search-vehicles.schema";
import type { SearchVehiclesInput } from "../schemas/search-vehicles.schema";
import { mergeSearchVehiclesInput } from "../helpers/merge-search-vehicles-input";
import { normalizeTypeCategoryFilters } from "../helpers/normalize-type-category-filters";
import {
  AssistantSearchExecutorService,
  SearchVehiclesResult,
  validateSearchVehiclesFilters,
} from "../services/assistant-search-executor.service";
import { AssistantEntityResolverService } from "../services/assistant-entity-resolver.service";
import { AssistantFilterCatalogService } from "../services/assistant-filter-catalog.service";

interface CreateSearchVehiclesToolOptions {
  initialFilters?: SearchVehiclesInput;
  searchExecutor: AssistantSearchExecutorService;
  filterCatalogService: AssistantFilterCatalogService;
  entityResolver: AssistantEntityResolverService;
}

const slugToText = (slug: string): string => slug.replace(/-/g, " ");

/**
 * El modelo no recibe la lista de marcas/modelos y a veces adivina el slug
 * ("mercedes" en vez de "mercedes-benz"), lo que devuelve 0 resultados. Se
 * pasan por el resolver del catálogo; si no resuelve, se deja el original.
 */
const resolveCatalogSlugs = async (
  input: SearchVehiclesInput,
  entityResolver: AssistantEntityResolverService,
): Promise<SearchVehiclesInput> => {
  const makes_slugs = input.makes_slugs?.length
    ? await Promise.all(
        input.makes_slugs.map(
          async (slug) =>
            (await entityResolver.resolve({ make: slugToText(slug) })).make_slug ?? slug,
        ),
      )
    : input.makes_slugs;

  const single_make = makes_slugs?.length === 1 ? makes_slugs[0] : undefined;
  const models_slugs = input.models_slugs?.length
    ? await Promise.all(
        input.models_slugs.map(
          async (slug) =>
            (
              await entityResolver.resolve({
                make: single_make ? slugToText(single_make) : undefined,
                model: slugToText(slug),
              })
            ).model_slug ?? slug,
        ),
      )
    : input.models_slugs;

  return { ...input, makes_slugs, models_slugs };
};

export const createSearchVehiclesTool = ({
  initialFilters,
  searchExecutor,
  filterCatalogService,
  entityResolver,
}: CreateSearchVehiclesToolOptions) =>
  tool({
    description:
      "Busca o refina vehículos activos en WiAuto con filtros estructurados. Combina los filtros iniciales del listing. Úsala SOLO para búsquedas nuevas, refinamientos, respuestas a clarificaciones o cuando el usuario pide otras opciones / ninguno le convence. NO la uses para comparar referencias (Ref. N) concretas, analizar un anuncio ya elegido, contactar al vendedor (usa prepareSellerContact) ni negociar (usa prepareNegotiation).",
    inputSchema: searchVehiclesInputSchema,
    execute: async (input): Promise<SearchVehiclesResult | { error: string }> => {
      const merged = mergeSearchVehiclesInput(
        initialFilters,
        await resolveCatalogSlugs(input, entityResolver),
      );
      const catalog = await filterCatalogService.getCatalog();
      const filters = normalizeTypeCategoryFilters(merged, catalog);

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
