import { Controller, Param, Post } from "@nestjs/common";

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { DuplicateVehicleAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
export class DuplicateVehicleController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Post(":id/duplicate")
  @DuplicateVehicleAuth()
  run(@Param("id") id: string) {
    return this.vehicle_service.duplicate({ vehicle_id: id });
  }
}
