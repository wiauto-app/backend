import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogFuelTypesService } from "@/src/contexts/vehicles/catalog/fuel_types/services/catalog-fuel-types.service";
import { CatalogModelsService } from "@/src/contexts/vehicles/catalog/models/services/catalog-models.service";
import { MakesService } from "@/src/contexts/vehicles/catalog/makes/services/makes.service";
import { CatalogVersionsService } from "@/src/contexts/vehicles/catalog/versions/services/catalog-versions.service";
import { CatalogYearsService } from "@/src/contexts/vehicles/catalog/years/services/catalog-years.service";
import {
  ConditionVehicle,
  STATUS_VEHICLE,
  TransmissionType,
} from "@/src/contexts/vehicles/types/vehicle";
import { InvalidateVehicleVersionIdException } from "@/src/contexts/vehicles/exceptions/InvalidateVehicleVersionId.exception";
import { VehicleFilter } from "@/src/contexts/vehicles/types/vehicle.filter";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";

import { VehicleAiContextDto } from "../dto/vehicle-ai-context.dto";

const SIMILAR_RADIUS_METERS = 100_000;
const TIER1_YEAR_DELTA = 1;
const TIER2_YEAR_DELTA = 2;
const MILEAGE_TOLERANCE_RATIO = 0.3;
const MARKET_STATS_PAGE_LIMIT = 200;

export type VehicleMarketStatsTier = 1 | 2;
export type VehicleMarketConfidence = "high" | "medium" | "low";

export interface VehicleMarketStatsResult {
  recommended_price: number;
  range_min: number;
  range_max: number;
  sample_count: number;
  tier: VehicleMarketStatsTier;
  confidence: VehicleMarketConfidence;
}

interface ResolvedVehicleCatalog {
  make_slug: string;
  model_slug: string;
  year: number;
  fuel_type_slug: string;
}

interface SimilarVehicleReference {
  mileage: number;
  lat: number;
  lng: number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
}

@Injectable()
export class VehicleMarketStatsService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly catalog_versions_service: CatalogVersionsService,
    private readonly makes_service: MakesService,
    private readonly catalog_models_service: CatalogModelsService,
    private readonly catalog_years_service: CatalogYearsService,
    private readonly catalog_fuel_types_service: CatalogFuelTypesService,
  ) {}

  async compute(context: VehicleAiContextDto): Promise<VehicleMarketStatsResult | null> {
    const catalog = await this.resolve_catalog(context.version_id);
    const reference: SimilarVehicleReference = {
      mileage: context.mileage,
      lat: context.lat,
      lng: context.lng,
      condition: context.condition,
      transmission_type: context.transmission_type,
    };

    const tier1_prices = await this.fetch_prices({
      reference,
      catalog,
      tier: 1,
    });

    if (tier1_prices.length >= 3) {
      return this.build_stats(tier1_prices, 1);
    }

    const tier2_prices = await this.fetch_prices({
      reference,
      catalog,
      tier: 2,
    });

    if (tier2_prices.length < 3) {
      return null;
    }

    return this.build_stats(tier2_prices, 2);
  }

  private async resolve_catalog(version_id: number): Promise<ResolvedVehicleCatalog> {
    const version = await this.catalog_versions_service.findById(version_id);
    if (!version) {
      throw new InvalidateVehicleVersionIdException();
    }

    const [make, model, year_row, fuel_type] = await Promise.all([
      this.makes_service.findById(version.make_id),
      this.catalog_models_service.findById(version.model_id),
      this.catalog_years_service.findById(version.year_id),
      this.catalog_fuel_types_service.findById(version.fuel_type_id)]);

    if (!make || !model || !year_row || !fuel_type) {
      throw new InvalidateVehicleVersionIdException();
    }

    return {
      make_slug: make.slug,
      model_slug: model.slug,
      year: year_row.year,
      fuel_type_slug: fuel_type.slug,
    };
  }

  private async fetch_prices(input: {
    reference: SimilarVehicleReference;
    catalog: ResolvedVehicleCatalog;
    tier: VehicleMarketStatsTier;
  }): Promise<number[]> {
    const filter = this.build_tier_filter(input);
    const result = await this.vehicle_repository.findAll(filter);
    return result.data.map((item) => item.price);
  }

  private build_tier_filter(input: {
    reference: SimilarVehicleReference;
    catalog: ResolvedVehicleCatalog;
    tier: VehicleMarketStatsTier;
  }): VehicleFilter {
    const { reference, catalog, tier } = input;
    const year_delta =
      tier === 1 ? TIER1_YEAR_DELTA : TIER2_YEAR_DELTA;
    const mileage_delta = Math.round(
      reference.mileage * MILEAGE_TOLERANCE_RATIO,
    );

    const base = {
      page: 1,
      limit: MARKET_STATS_PAGE_LIMIT,
      order_by: "created_at",
      order_direction: "DESC" as const,
      status: STATUS_VEHICLE.ACTIVE,
      condition: reference.condition,
      makes_slugs: [catalog.make_slug],
    };

    if (tier === 1) {
      return new VehicleFilter({
        ...base,
        models_slugs: [catalog.model_slug],
        since_year: catalog.year - year_delta,
        until_year: catalog.year + year_delta,
        since_mileage: Math.max(0, reference.mileage - mileage_delta),
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
      lat: reference.lat,
      lng: reference.lng,
      radius: SIMILAR_RADIUS_METERS,
    });
  }

  private build_stats(
    prices: number[],
    tier: VehicleMarketStatsTier,
  ): VehicleMarketStatsResult {
    const sorted = [...prices].sort((a, b) => a - b);
    const sample_count = sorted.length;

    return {
      recommended_price: Math.round(this.median(sorted)),
      range_min: Math.round(this.percentile(sorted, 25)),
      range_max: Math.round(this.percentile(sorted, 75)),
      sample_count,
      tier,
      confidence: this.resolve_confidence(sample_count),
    };
  }

  private median(sorted_values: number[]): number {
    const mid = Math.floor(sorted_values.length / 2);
    if (sorted_values.length % 2 === 0) {
      return (sorted_values[mid - 1] + sorted_values[mid]) / 2;
    }
    return sorted_values[mid];
  }

  private percentile(sorted_values: number[], percentile_value: number): number {
    const index = (percentile_value / 100) * (sorted_values.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) {
      return sorted_values[lower];
    }
    return (
      sorted_values[lower] +
      (sorted_values[upper] - sorted_values[lower]) * (index - lower)
    );
  }

  private resolve_confidence(sample_count: number): VehicleMarketConfidence {
    if (sample_count >= 10) {
      return "high";
    }
    if (sample_count >= 5) {
      return "medium";
    }
    return "low";
  }
}
