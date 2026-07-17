import { Controller, Get } from "@nestjs/common";
import { V1_FILTERS } from "../route.constants";
import { VehicleFiltersService } from "../../services/vehicle-filters.service";

@Controller(V1_FILTERS)
export class FindFiltersController {
  constructor(private readonly vehicle_filters_service: VehicleFiltersService) {}

  @Get()
  findFilters() {
    return this.vehicle_filters_service.findFilters();
  }
}