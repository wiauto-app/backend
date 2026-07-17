import { Controller, Get, Param, Query } from "@nestjs/common";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";

import { V1_VEHICLES } from "../../route.constants";
import {
  FindSimilarVehiclesParamsHttpDto,
  FindSimilarVehiclesQueryHttpDto,
} from "./find-similar-vehicles.http-dto";

@Controller(V1_VEHICLES)
export class FindSimilarVehiclesController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Get(":id/similar")
  run(
    @Param() params: FindSimilarVehiclesParamsHttpDto,
    @Query() query: FindSimilarVehiclesQueryHttpDto,
  ) {
    return this.vehicle_service.findSimilar({
      vehicle_id: params.id,
      page: query.page,
      limit: query.limit,
    });
  }
}
