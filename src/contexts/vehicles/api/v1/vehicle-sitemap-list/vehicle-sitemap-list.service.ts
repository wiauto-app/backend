import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  SitemapVehicleListingsMeta,
  SitemapVehicleListingsPage,
  SitemapVehiclesListService,
} from "@/src/contexts/vehicles/services/sitemap-vehicles-list.service";

import {
  VEHICLE_SITEMAP_LISTING_PAGE_SIZE,
  VehicleSitemapListHttpDto,
  VehicleSitemapListMetaHttpDto,
} from "./vehicle-sitemap-list.http-dto";

export { VEHICLE_SITEMAP_LISTING_PAGE_SIZE };

@Injectable()
export class VehicleSitemapListService {
  constructor(
    private readonly sitemap_vehicles_list_service: SitemapVehiclesListService,
  ) {}

  getMeta(
    dto: VehicleSitemapListMetaHttpDto,
  ): Promise<SitemapVehicleListingsMeta> {
    return this.sitemap_vehicles_list_service.getMeta(
      dto.variant,
      dto.limit,
    );
  }

  getPage(dto: VehicleSitemapListHttpDto): Promise<SitemapVehicleListingsPage> {
    return this.sitemap_vehicles_list_service.getPage({
      variant: dto.variant,
      page: dto.page,
      limit: dto.limit,
    });
  }
}
