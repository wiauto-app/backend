import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmVehicleRepository } from "../repositories/typeorm.vehicle-repository";
import {
  VehicleListingSitemapEntry,
  VehicleListingSitemapVariant,
} from "../types/vehicle-listing-sitemap";

export interface SitemapVehicleListingsMeta {
  total: number;
  limit: number;
  totalPages: number;
  variant: VehicleListingSitemapVariant;
}

export interface SitemapVehicleListingsPage {
  data: VehicleListingSitemapEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  variant: VehicleListingSitemapVariant;
}

@Injectable()
export class SitemapVehiclesListService {
  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async getMeta(
    variant: VehicleListingSitemapVariant,
    limit: number,
  ): Promise<SitemapVehicleListingsMeta> {
    const total = await this.vehicle_repository.countSitemapVehicleListings({
      variant,
    });

    return {
      total,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      variant,
    };
  }

  async getPage({
    variant,
    page,
    limit,
  }: {
    variant: VehicleListingSitemapVariant;
    page: number;
    limit: number;
  }): Promise<SitemapVehicleListingsPage> {
    const { data, total } =
      await this.vehicle_repository.findSitemapVehicleListings({
        page,
        limit,
        variant,
      });

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      variant,
    };
  }
}
