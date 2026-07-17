import { Injectable } from "@nestjs/common";
import { ONE_HOUR } from "@/src/common/envs";
import { VehicleTypesService } from "@/src/contexts/vehicles/services/vehicle-types.service";
import { ServicesService } from "@/src/contexts/vehicles/services/services.service";
import { CuotasService } from "@/src/contexts/vehicles/services/cuotas.service";
import { TractionsService } from "@/src/contexts/vehicles/services/tractions.service";
import { WarrantyTypesService } from "@/src/contexts/vehicles/services/warranty-types.service";
import { ColorsService } from "@/src/contexts/vehicles/services/colors.service";
import { DgtLabelsService } from "@/src/contexts/vehicles/services/dgt-labels.service";
import { FeaturesService } from "@/src/contexts/vehicles/services/features.service";
import { CatalogFuelTypesService } from "@/src/contexts/vehicles/catalog/fuel_types/services/catalog-fuel-types.service";
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
    private readonly vehicleTypesService: VehicleTypesService,
    private readonly servicesService: ServicesService,
    private readonly cuotasService: CuotasService,
    private readonly tractionsService: TractionsService,
    private readonly warrantiesService: WarrantyTypesService,
    private readonly colorsService: ColorsService,
    private readonly dgtLabelsService: DgtLabelsService,
    private readonly featuresService: FeaturesService,
    private readonly fuelTypesService: CatalogFuelTypesService,
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
        this.vehicleTypesService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.colorsService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.featuresService.findAll({
          page,
          limit,
          skip: (page - 1) * limit,
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
        this.servicesService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.cuotasService.findAll({
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
        this.tractionsService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.warrantiesService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.dgtLabelsService.findAll(buildCatalogPageQuery(page, limit)),
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
        this.fuelTypesService.findAll(buildCatalogPageQuery(page, limit)),
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
