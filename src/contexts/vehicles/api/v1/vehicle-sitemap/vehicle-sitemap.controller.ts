import { Controller, Get, Query } from "@nestjs/common";

import { V1_SITEMAP_VEHICLES } from "../../route.constants";
import { VehicleSitemapHttpDto } from "./vehicle-sitemap.http-dto";
import { VehicleSitemapService } from "./vehicle-sitemap.service";

@Controller(V1_SITEMAP_VEHICLES)
export class VehicleSitemapController {
  constructor(
    private readonly vehicle_sitemap_service: VehicleSitemapService,
  ) {}

  @Get("meta")
  getMeta(@Query() query: VehicleSitemapHttpDto) {
    return this.vehicle_sitemap_service.getMeta(query.limit);
  }

  @Get()
  getPage(@Query() query: VehicleSitemapHttpDto) {
    return this.vehicle_sitemap_service.getPage(query);
  }
}
