import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateVehicleHttpDto } from "./update-vehicle.http-dto";
import { UpdateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/update-vehicle-use-case/update-vehicle.use-case";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/infrastructure/guards/vehicle-owner.guard";

@Controller(V1_VEHICLES)
export class UpdateVehicleController {
  constructor(private readonly updateVehicleUseCase: UpdateVehicleUseCase) {}

  @Patch(":id")
  @UseGuards(JwtGuard, VehicleOwnerGuard)
  run(@Param("id") id: string, @Body() body: UpdateVehicleHttpDto) {
    return this.updateVehicleUseCase.execute({ id, ...body });
  }
}
