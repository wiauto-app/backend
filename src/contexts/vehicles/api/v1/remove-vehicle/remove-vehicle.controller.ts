import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/guards/vehicle-owner.guard";
import { V1_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "../find-vehicle/find-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class RemoveVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Delete(":id")
  @UseGuards(JwtGuard, VehicleOwnerGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  run(@Param() params: FindVehicleHttpDto) {
    return this.vehicle_service.remove({ id: params.id });
  }
}
