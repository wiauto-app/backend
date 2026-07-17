import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { V1_ADMIN_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "../../v1/find-vehicle/find-vehicle.http-dto";

@Controller(V1_ADMIN_VEHICLES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminGetVehicleController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Get(":id")
  run(@Param() params: FindVehicleHttpDto) {
    return this.vehicle_service.adminFindOne({ id: params.id });
  }
}
