import { Body, Controller, Param, Patch } from "@nestjs/common";

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateOwnerVehicleStatusHttpDto } from "./update-owner-vehicle-status.http-dto";

@Controller(V1_VEHICLES)
export class UpdateOwnerVehicleStatusController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Patch(":id/status")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string, @Body() body: UpdateOwnerVehicleStatusHttpDto) {
    return this.vehicle_service.updateOwnerStatus({
      vehicle_id: id,
      status: body.status,
    });
  }
}
