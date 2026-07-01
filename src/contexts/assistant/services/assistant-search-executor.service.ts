import { Injectable } from "@nestjs/common";
import { FindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";
import { FindAllVehiclesUseCaseDto } from "@/src/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/find-all-vehicles.dto";
import {
  SearchVehiclesInput,
} from "../schemas/search-vehicles.schema";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";
import { AssistantResolvedEntities } from "../types/assistant-resolved-entities";

const SEARCH_RESULT_LIMIT = 8;

export interface SearchVehiclesResult {
  total: number;
  vehicles: unknown[];
  appliedFilters: SearchVehiclesInput;
}

const formatSlugOptions = (slugs: string[]): string => {
  if (slugs.length === 0) {
    return "ninguna opción disponible";
  }

  return slugs.slice(0, 12).join(", ");
};

const validateSlugArray = (
  values: string[] | undefined,
  validSlugs: Set<string>,
  label: string,
): void => {
  if (!values?.length) {
    return;
  }

  const invalid = values.filter((slug) => !validSlugs.has(slug));
  if (invalid.length === 0) {
    return;
  }

  throw new Error(
    `El slug de ${label} '${invalid.join(", ")}' no existe; opciones: ${formatSlugOptions([...validSlugs])}.`,
  );
};

const validateIdArray = (
  values: string[] | undefined,
  validIds: Set<string>,
  label: string,
): void => {
  if (!values?.length) {
    return;
  }

  const invalid = values.filter((id) => !validIds.has(id));
  if (invalid.length === 0) {
    return;
  }

  throw new Error(
    `El id de ${label} '${invalid.join(", ")}' no existe; usa ids del catálogo DGT.`,
  );
};

const validateResolvedSlugs = (
  values: string[] | undefined,
  resolvedSlug: string | undefined,
  label: string,
): void => {
  if (!values?.length || !resolvedSlug) {
    return;
  }

  const invalid = values.filter((slug) => slug !== resolvedSlug);
  if (invalid.length === 0) {
    return;
  }

  throw new Error(
    `El slug de ${label} '${invalid.join(", ")}' no coincide con la entidad resuelta '${resolvedSlug}'.`,
  );
};

export const validateSearchVehiclesFilters = (
  filters: SearchVehiclesInput,
  catalog: AssistantFilterCatalog,
  resolved: AssistantResolvedEntities,
): void => {
  if (filters.type_slug) {
    const validTypeSlugs = new Set(catalog.vehicleTypes.map((item) => item.slug));
    if (!validTypeSlugs.has(filters.type_slug)) {
      throw new Error(
        `El slug de tipo '${filters.type_slug}' no existe; opciones: ${formatSlugOptions([...validTypeSlugs])}.`,
      );
    }
  }

  validateResolvedSlugs(filters.makes_slugs, resolved.make_slug, "marca");
  validateResolvedSlugs(filters.models_slugs, resolved.model_slug, "modelo");
  validateSlugArray(
    filters.color_slugs,
    new Set(catalog.colors.map((item) => item.slug)),
    "color",
  );
  validateSlugArray(
    filters.features_slugs,
    new Set(catalog.features.map((item) => item.slug)),
    "equipamiento",
  );
  validateSlugArray(
    filters.service_slugs,
    new Set(catalog.services.map((item) => item.slug)),
    "servicio",
  );
  validateSlugArray(
    filters.cuota_slugs,
    new Set(catalog.cuotas.map((item) => item.slug)),
    "cuota",
  );
  validateSlugArray(
    filters.traction_slugs,
    new Set(catalog.tractions.map((item) => item.slug)),
    "tracción",
  );
  validateSlugArray(
    filters.warranty_slugs,
    new Set(catalog.warranties.map((item) => item.slug)),
    "garantía",
  );
  validateSlugArray(
    filters.fuel_type_slugs,
    new Set(catalog.fuels.map((item) => item.slug)),
    "combustible",
  );
  validateIdArray(
    filters.dgt_label_ids,
    new Set(catalog.dgtLabels.map((item) => item.id)),
    "etiqueta DGT",
  );
};

@Injectable()
export class AssistantSearchExecutorService {
  constructor(
    private readonly findAllVehiclesUseCase: FindAllVehiclesUseCase,
  ) {}

  async execute(
    filters: SearchVehiclesInput,
    catalog: AssistantFilterCatalog,
    resolved: AssistantResolvedEntities,
  ): Promise<SearchVehiclesResult> {
    validateSearchVehiclesFilters(filters, catalog, resolved);

    const result = await this.findAllVehiclesUseCase.execute({
      ...filters,
      page: 1,
      limit: SEARCH_RESULT_LIMIT,
      makes_slugs: filters.makes_slugs ?? [],
      models_slugs: filters.models_slugs ?? [],
      service_slugs: filters.service_slugs ?? [],
      provinces_slugs: filters.provinces_slugs ?? [],
      comunities_slugs: filters.comunities_slugs ?? [],
      municipalities_slugs: filters.municipalities_slugs ?? [],
      publisher_types: filters.publisher_types ?? [],
      warranty_slugs: filters.warranty_slugs ?? [],
      transmission_types: filters.transmission_types ?? [],
      fuel_type_slugs: filters.fuel_type_slugs ?? [],
      traction_slugs: filters.traction_slugs ?? [],
      dgt_label_ids: filters.dgt_label_ids ?? [],
      features_slugs: filters.features_slugs ?? [],
      color_slugs: filters.color_slugs ?? [],
      cuota_slugs: filters.cuota_slugs ?? [],
      exclude_vehicle_ids: filters.exclude_vehicle_ids ?? [],
      dealership_ids: filters.dealership_ids ?? [],
    } as FindAllVehiclesUseCaseDto);

    return {
      total: result.total,
      vehicles: result.data,
      appliedFilters: filters,
    };
  }
}
