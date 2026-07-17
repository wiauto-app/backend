import { Controller, Param, Post } from "@nestjs/common";

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
export class RenewVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Post(":id/renew")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string) {
    return this.vehicle_service.renew({ vehicle_id: id });
  }
}
