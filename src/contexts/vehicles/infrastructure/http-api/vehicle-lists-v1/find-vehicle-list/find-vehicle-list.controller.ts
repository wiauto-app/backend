import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindVehicleListUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/find-vehicle-list-use-case/find-vehicle-list.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class FindVehicleListController {
  constructor(
    private readonly find_vehicle_list_use_case: FindVehicleListUseCase,
  ) {}

  @Get(":list_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
  ) {
    return this.find_vehicle_list_use_case.execute({ list_id, profile_id });
  }
}
