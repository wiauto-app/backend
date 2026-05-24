import { Controller, Get, Param } from "@nestjs/common";

import { AdminGetVehicleUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-get-vehicle-use-case/admin-get-vehicle.use-case";
import { V1_ADMIN_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "../../v1/find-vehicle/find-vehicle.http-dto";

@Controller(V1_ADMIN_VEHICLES)
export class AdminGetVehicleController {
  constructor(
    private readonly admin_get_vehicle_use_case: AdminGetVehicleUseCase,
  ) {}

  @Get(":id")
  run(@Param() params: FindVehicleHttpDto) {
    return this.admin_get_vehicle_use_case.execute({ id: params.id });
  }
}
