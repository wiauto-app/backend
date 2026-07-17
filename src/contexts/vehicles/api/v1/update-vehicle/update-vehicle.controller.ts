import { Body, Controller, Param, Patch, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_VEHICLES } from "../../route.constants";
import { UpdateVehicleHttpDto } from "./update-vehicle.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/guards/vehicle-owner.guard";

@Controller(V1_VEHICLES)
export class UpdateVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Patch(":id")
  @UseGuards(JwtGuard, VehicleOwnerGuard)
  run(@Param("id") id: string, @Body() body: UpdateVehicleHttpDto) {
    return this.vehicle_service.update({ id, ...body });
  }
}
