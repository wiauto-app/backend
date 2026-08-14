import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "./find-vehicle.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { Request } from "express";

@Controller(V1_VEHICLES)
export class FindVehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Get(":id")
  @UseGuards(OptionalJwtGuard)
  run(@Param() findVehicleHttpDto: FindVehicleHttpDto,@Req() req: Request) {
    return this.vehicleService.findOne(findVehicleHttpDto,req.user?.id);
  }
}
