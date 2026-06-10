import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AdminOnlyGuard } from "@/src/contexts/roles/guards/admin-only.guard";
import { AdminUpdateVehicleStatusUseCase } from "@/src/contexts/vehicles/application/admin-vehicles/admin-update-vehicle-status-use-case/admin-update-vehicle-status.use-case";
import { V1_ADMIN_VEHICLES } from "../../route.constants";

import { AdminUpdateVehicleStatusHttpDto } from "./admin-update-vehicle-status.http-dto";

@Controller(V1_ADMIN_VEHICLES)
@UseGuards(JwtGuard, AdminOnlyGuard)
export class AdminUpdateVehicleStatusController {
  constructor(
    private readonly admin_update_vehicle_status_use_case: AdminUpdateVehicleStatusUseCase,
  ) {}

  @Patch(":id/status")
  run(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateVehicleStatusHttpDto,
  ) {
    return this.admin_update_vehicle_status_use_case.execute({
      vehicle_id: id,
      status: body.status,
      message: body.message,
    });
  }
}
