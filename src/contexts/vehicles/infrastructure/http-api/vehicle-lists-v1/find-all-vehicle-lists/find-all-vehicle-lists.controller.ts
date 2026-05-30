import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindAllVehicleListsUseCase } from "@/src/contexts/vehicles/application/vehicle-list-use-cases/find-all-vehicle-lists-use-case/find-all-vehicle-lists.use-case";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class FindAllVehicleListsController {
  constructor(
    private readonly find_all_vehicle_lists_use_case: FindAllVehicleListsUseCase,
  ) {}

  @Get()
  run(@GetUserId() profile_id: string) {
    return this.find_all_vehicle_lists_use_case.execute({ profile_id });
  }
}
