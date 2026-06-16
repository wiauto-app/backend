import { Controller, Param, Post } from "@nestjs/common";

import { RenewVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/renew-vehicle-use-case/renew-vehicle.use-case";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
export class RenewVehicleController {
  constructor(private readonly renew_vehicle_use_case: RenewVehicleUseCase) {}

  @Post(":id/renew")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string) {
    return this.renew_vehicle_use_case.execute({ vehicle_id: id });
  }
}
