import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { V1_ADMIN_VEHICLES } from "../../route.constants";

import { AdminUpdateVehicleStatusHttpDto } from "./admin-update-vehicle-status.http-dto";

@Controller(V1_ADMIN_VEHICLES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateVehicleStatusController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Patch(":id/status")
  run(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateVehicleStatusHttpDto,
  ) {
    return this.vehicle_service.adminUpdateStatus({
      vehicle_id: id,
      status: body.status,
      message: body.message,
    });
  }
}
