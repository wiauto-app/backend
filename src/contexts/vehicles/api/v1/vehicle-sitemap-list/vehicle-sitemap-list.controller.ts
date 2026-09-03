import { Controller, Get, Query } from "@nestjs/common";

import { V1_SITEMAP_VEHICLE_LISTINGS } from "../../route.constants";
import {
  VehicleSitemapListHttpDto,
  VehicleSitemapListMetaHttpDto,
} from "./vehicle-sitemap-list.http-dto";
import { VehicleSitemapListService } from "./vehicle-sitemap-list.service";

@Controller(V1_SITEMAP_VEHICLE_LISTINGS)
export class VehicleSitemapListController {
  constructor(
    private readonly vehicle_sitemap_list_service: VehicleSitemapListService,
  ) {}

  @Get("meta")
  getMeta(@Query() query: VehicleSitemapListMetaHttpDto) {
    return this.vehicle_sitemap_list_service.getMeta(query);
  }

  @Get()
  getPage(@Query() query: VehicleSitemapListHttpDto) {
    return this.vehicle_sitemap_list_service.getPage(query);
  }
}
