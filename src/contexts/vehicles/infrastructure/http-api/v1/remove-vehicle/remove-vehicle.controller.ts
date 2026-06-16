import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RemoveVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/remove-vehicle-use-case/remove-vehicle.use-case";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/infrastructure/guards/vehicle-owner.guard";
import { V1_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "../find-vehicle/find-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class RemoveVehicleController {
  constructor(private readonly remove_vehicle_use_case: RemoveVehicleUseCase) {}

  @Delete(":id")
  @UseGuards(JwtGuard, VehicleOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  run(@Param() params: FindVehicleHttpDto) {
    return this.remove_vehicle_use_case.execute({ id: params.id });
  }
}
