import { Controller, Param, Post } from "@nestjs/common";

import { DuplicateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/duplicate-vehicle-use-case/duplicate-vehicle.use-case";
import { DuplicateVehicleAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
export class DuplicateVehicleController {
  constructor(
    private readonly duplicate_vehicle_use_case: DuplicateVehicleUseCase,
  ) {}

  @Post(":id/duplicate")
  @DuplicateVehicleAuth()
  run(@Param("id") id: string) {
    return this.duplicate_vehicle_use_case.execute({ vehicle_id: id });
  }
}
