import { Controller, Get, Query } from "@nestjs/common";
import { V1_FILTERS } from "../route.constants";
import { VehicleFiltersService } from "../../services/vehicle-filters.service";
import { FindActiveFiltersHttpDto } from "./find-active-filters.http-dto";

@Controller(V1_FILTERS)
export class FindActiveFiltersController {
  constructor(
    private readonly vehicle_filters_service: VehicleFiltersService,
  ) {}

  @Get("active")
  findActiveFilters(@Query() find_active_filters_http_dto: FindActiveFiltersHttpDto) {
    return this.vehicle_filters_service.findActiveFilters(find_active_filters_http_dto);
  }
}
