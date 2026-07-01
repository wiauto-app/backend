import { Injectable } from "@nestjs/common";
import { ONE_HOUR } from "@/src/common/envs";
import { VehicleTypesUseCase } from "@/src/contexts/vehicles/application/vehicle-types-use-cases/vehicle-types.use-case";
import { ServicesUseCase } from "@/src/contexts/vehicles/application/services-use-cases/services.use-case";
import { CuotasUseCase } from "@/src/contexts/vehicles/application/cuotas-use-cases/cuotas.use-case";
import { TractionsUseCase } from "@/src/contexts/vehicles/application/tractions-use-cases/tractions.use-case";
import { WarrantyTypesUseCase } from "@/src/contexts/vehicles/application/warranty-types-use-cases/warranty-types.use-case";
import { ColorsUseCase } from "@/src/contexts/vehicles/application/colors-use-cases/colors.use-case";
import { DgtLabelsUseCase } from "@/src/contexts/vehicles/application/dgt-labels-use-cases/dgt-labels.use-case";
import { FindFeaturesUseCase } from "@/src/contexts/vehicles/application/features/find-features-use-case/find-features.use-case";
import { CatalogFuelTypesUseCase } from "@/src/contexts/vehicles/catalog/fuel_types/application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";
import { fetchAllPages } from "../helpers/fetch-all-pages";
import { AssistantFilterCatalog } from "../types/assistant-filter-catalog";

const CATALOG_PAGE_LIMIT = 100;
const DEFAULT_ORDER = { order_by: "name", order_direction: "ASC" as const };

const buildCatalogPageQuery = (page: number, limit: number) => ({
  page,
  limit,
  skip: (page - 1) * limit,
  ...DEFAULT_ORDER,
});

@Injectable()
export class AssistantFilterCatalogService {
  private cached_catalog: AssistantFilterCatalog | null = null;
  private cache_expires_at = 0;

  constructor(
    private readonly vehicleTypesUseCase: VehicleTypesUseCase,
    private readonly servicesUseCase: ServicesUseCase,
    private readonly cuotasUseCase: CuotasUseCase,
    private readonly tractionsUseCase: TractionsUseCase,
    private readonly warrantiesUseCase: WarrantyTypesUseCase,
    private readonly colorsUseCase: ColorsUseCase,
    private readonly dgtLabelsUseCase: DgtLabelsUseCase,
    private readonly featuresUseCase: FindFeaturesUseCase,
    private readonly fuelTypesUseCase: CatalogFuelTypesUseCase,
  ) {}

  async getCatalog(): Promise<AssistantFilterCatalog> {
    const now = Date.now();

    if (this.cached_catalog && now < this.cache_expires_at) {
      return this.cached_catalog;
    }

    const catalog = await this.loadFullCatalog();
    this.cached_catalog = catalog;
    this.cache_expires_at = now + ONE_HOUR;

    return catalog;
  }

  invalidateCache(): void {
    this.cached_catalog = null;
    this.cache_expires_at = 0;
  }

  async loadFullCatalog(): Promise<AssistantFilterCatalog> {
    const [
      vehicleTypes,
      colors,
      features,
      services,
      cuotas,
      tractions,
      warranties,
      dgtLabels,
      fuels,
    ] = await Promise.all([
      this.loadVehicleTypes(),
      this.loadColors(),
      this.loadFeatures(),
      this.loadServices(),
      this.loadCuotas(),
      this.loadTractions(),
      this.loadWarranties(),
      this.loadDgtLabels(),
      this.loadFuels(),
    ]);

    return {
      vehicleTypes,
      colors,
      features,
      services,
      cuotas,
      tractions,
      warranties,
      dgtLabels,
      fuels,
    };
  }

  private async loadVehicleTypes() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.vehicleTypesUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      image_url: item.image_url ?? null,
    }));
  }

  private async loadColors() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.colorsUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      hex_code: item.hex_code,
    }));
  }

  private async loadFeatures() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.featuresUseCase.execute({
          page,
          limit,
          ...DEFAULT_ORDER,
        }),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
    }));
  }

  private async loadServices() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.servicesUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
    }));
  }

  private async loadCuotas() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.cuotasUseCase.findAll({
          ...buildCatalogPageQuery(page, limit),
          order_by: "value",
        }),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      value: item.value,
    }));
  }

  private async loadTractions() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.tractionsUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
    }));
  }

  private async loadWarranties() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.warrantiesUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
    }));
  }

  private async loadDgtLabels() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.dgtLabelsUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      code: item.code,
      description: item.description,
    }));
  }

  private async loadFuels() {
    const rows = await fetchAllPages(
      (page, limit) =>
        this.fuelTypesUseCase.findAll(buildCatalogPageQuery(page, limit)),
      CATALOG_PAGE_LIMIT,
    );

    return rows.map((item) => ({
      id: item.id!,
      slug: item.slug,
      name: item.name,
      can_charge: item.can_charge,
    }));
  }
}
