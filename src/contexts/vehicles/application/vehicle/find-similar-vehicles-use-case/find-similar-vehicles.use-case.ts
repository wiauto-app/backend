import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogFuelTypesRepository } from "@/src/contexts/vehicles/catalog/fuel_types/domain/repositories/catalog-fuel-types.repository";
import { CatalogModelsRepository } from "@/src/contexts/vehicles/catalog/models/domain/repositories/catalog-models.repository";
import { MakesRepository } from "@/src/contexts/vehicles/catalog/makes/domain/repositories/makes.repository";
import { CatalogVersionsRepository } from "@/src/contexts/vehicles/catalog/versions/domain/repositories/catalog-versions.repository";
import { CatalogYearsRepository } from "@/src/contexts/vehicles/catalog/years/domain/repositories/catalog-years.repository";
import {
  ConditionVehicle,
  STATUS_VEHICLE,
  TransmissionType,
} from "@/src/contexts/vehicles/domain/entities/vehicle";
import { VehicleFilter } from "@/src/contexts/vehicles/domain/filters/vehicle.filter";
import { VehicleListItem } from "@/src/contexts/vehicles/domain/read-models/vehicle-list-item";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { VehicleNotFoundException } from "@/src/contexts/vehicles/domain/exceptions/vehicle-not-found.exception";
import { InvalidateVehicleVersionIdException } from "@/src/contexts/vehicles/domain/exceptions/InvalidateVehicleVersionId.exception";

import { FindSimilarVehiclesDto } from "./find-similar-vehicles.dto";

const SIMILAR_RADIUS_METERS = 100_000;
const TIER1_YEAR_DELTA = 1;
const TIER2_YEAR_DELTA = 2;
const MILEAGE_TOLERANCE_RATIO = 0.3;

export type SimilarVehiclesTier = 1 | 2;

export interface FindSimilarVehiclesListingHrefSlugs {
  make: string;
  model: string;
}

export interface FindSimilarVehiclesResult {
  data: VehicleListItem[];
  total: number;
  page: number;
  limit: number;
  tier: SimilarVehiclesTier;
  listing_href_slugs: FindSimilarVehiclesListingHrefSlugs;
}

interface ResolvedVehicleCatalog {
  make_slug: string;
  model_slug: string;
  year: number;
  fuel_type_slug: string;
}

@Injectable()
export class FindSimilarVehiclesUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly catalog_versions_repository: CatalogVersionsRepository,
    private readonly makes_repository: MakesRepository,
    private readonly catalog_models_repository: CatalogModelsRepository,
    private readonly catalog_years_repository: CatalogYearsRepository,
    private readonly catalog_fuel_types_repository: CatalogFuelTypesRepository,
  ) {}

  async execute(
    dto: FindSimilarVehiclesDto,
  ): Promise<FindSimilarVehiclesResult> {
    const reference = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!reference) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const catalog = await this.resolve_catalog(reference.version_id);
    const listing_href_slugs: FindSimilarVehiclesListingHrefSlugs = {
      make: catalog.make_slug,
      model: catalog.model_slug,
    };

    const tier1_filter = this.build_tier_filter({
      reference,
      catalog,
      tier: 1,
      page: dto.page,
      limit: dto.limit,
    });

    const tier1_result = await this.vehicle_repository.findAll(tier1_filter);
    if (tier1_result.total > 0) {
      return {
        ...tier1_result,
        tier: 1,
        listing_href_slugs,
      };
    }

    const tier2_filter = this.build_tier_filter({
      reference,
      catalog,
      tier: 2,
      page: dto.page,
      limit: dto.limit,
    });
    const tier2_result = await this.vehicle_repository.findAll(tier2_filter);

    return {
      ...tier2_result,
      tier: 2,
      listing_href_slugs,
    };
  }

  private async resolve_catalog(
    version_id: number,
  ): Promise<ResolvedVehicleCatalog> {
    const version = await this.catalog_versions_repository.findOne(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const version_primitives = version.toPrimitives();
    const [make, model, year_row, fuel_type] = await Promise.all([
      this.makes_repository.findOne(version_primitives.make_id),
      this.catalog_models_repository.findOne(version_primitives.model_id),
      this.catalog_years_repository.findOne(version_primitives.year_id),
      this.catalog_fuel_types_repository.findOne(version_primitives.fuel_type_id),
    ]);

    if (!make || !model || !year_row || !fuel_type) {
      throw new InvalidateVehicleVersionIdException();
    }

    return {
      make_slug: make.toPrimitives().slug,
      model_slug: model.toPrimitives().slug,
      year: year_row.toPrimitives().year,
      fuel_type_slug: fuel_type.toPrimitives().slug,
    };
  }

  private build_tier_filter(input: {
    reference: {
      id: string;
      mileage: number;
      lat: number;
      lng: number;
      condition: string;
      transmission_type: TransmissionType;
    };
    catalog: ResolvedVehicleCatalog;
    tier: SimilarVehiclesTier;
    page: number;
    limit: number;
  }): VehicleFilter {
    const { reference, catalog, tier, page, limit } = input;
    const year_delta =
      tier === 1 ? TIER1_YEAR_DELTA : TIER2_YEAR_DELTA;
    const mileage_delta = Math.round(
      reference.mileage * MILEAGE_TOLERANCE_RATIO,
    );

    const base = {
      page,
      limit,
      order_by: "created_at",
      order_direction: "DESC" as const,
      status: STATUS_VEHICLE.ACTIVE,
      exclude_vehicle_ids: [reference.id],
      condition: reference.condition as ConditionVehicle,
      makes_slugs: [catalog.make_slug],
    };

    if (tier === 1) {
      return new VehicleFilter({
        ...base,
        models_slugs: [catalog.model_slug],
        since_year: catalog.year - year_delta,
        until_year: catalog.year + year_delta,
        since_mileage: Math.max(
          0,
          reference.mileage - mileage_delta,
        ),
        until_mileage: reference.mileage + mileage_delta,
        transmission_types: [reference.transmission_type],
        fuel_type_slugs: [catalog.fuel_type_slug],
        lat: reference.lat,
        lng: reference.lng,
        radius: SIMILAR_RADIUS_METERS,
      });
    }

    return new VehicleFilter({
      ...base,
      since_year: catalog.year - year_delta,
      until_year: catalog.year + year_delta,
    });
  }
}
