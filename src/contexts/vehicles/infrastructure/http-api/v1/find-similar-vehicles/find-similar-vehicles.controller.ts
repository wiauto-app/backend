import { Controller, Get, Param, Query } from "@nestjs/common";
import { FindSimilarVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-similar-vehicles-use-case/find-similar-vehicles.use-case";

import { V1_VEHICLES } from "../../route.constants";
import {
  FindSimilarVehiclesParamsHttpDto,
  FindSimilarVehiclesQueryHttpDto,
} from "./find-similar-vehicles.http-dto";

@Controller(V1_VEHICLES)
export class FindSimilarVehiclesController {
  constructor(
    private readonly find_similar_vehicles_use_case: FindSimilarVehiclesUseCase,
  ) {}

  @Get(":id/similar")
  run(
    @Param() params: FindSimilarVehiclesParamsHttpDto,
    @Query() query: FindSimilarVehiclesQueryHttpDto,
  ) {
    return this.find_similar_vehicles_use_case.execute({
      vehicle_id: params.id,
      page: query.page,
      limit: query.limit,
    });
  }
}
