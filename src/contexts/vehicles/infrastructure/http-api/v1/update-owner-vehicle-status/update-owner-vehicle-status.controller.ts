import { Body, Controller, Param, Patch } from "@nestjs/common";

import { UpdateOwnerVehicleStatusUseCase } from "@/src/contexts/vehicles/application/vehicle/update-owner-vehicle-status-use-case/update-owner-vehicle-status.use-case";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateOwnerVehicleStatusHttpDto } from "./update-owner-vehicle-status.http-dto";

@Controller(V1_VEHICLES)
export class UpdateOwnerVehicleStatusController {
  constructor(
    private readonly update_owner_vehicle_status_use_case: UpdateOwnerVehicleStatusUseCase,
  ) {}

  @Patch(":id/status")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string, @Body() body: UpdateOwnerVehicleStatusHttpDto) {
    return this.update_owner_vehicle_status_use_case.execute({
      vehicle_id: id,
      status: body.status,
    });
  }
}
