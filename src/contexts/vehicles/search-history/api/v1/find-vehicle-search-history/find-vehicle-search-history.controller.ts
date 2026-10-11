import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import {
  V1_VEHICLES,
  V1_VEHICLES_SEARCH_HISTORY,
} from "../../../../api/route.constants";
import { VehicleSearchHistoryService } from "../../../services/vehicle-search-history.service";
import { FindVehicleSearchHistoryHttpDto } from "./find-vehicle-search-history.http-dto";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class FindVehicleSearchHistoryController {
  constructor(
    private readonly vehicleSearchHistoryService: VehicleSearchHistoryService,
  ) {}

  @Get(V1_VEHICLES_SEARCH_HISTORY)
  run(
    @GetUserId() userId: string,
    @Query() query: FindVehicleSearchHistoryHttpDto,
  ) {
    return this.vehicleSearchHistoryService.findAll({
      user_id: userId,
      limit: query.limit,
    });
  }
}
