import {
  Controller,
  Get,
  Param,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VehicleOwnerGuard } from "@/src/contexts/vehicles/guards/vehicle-owner.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { V1_VEHICLES } from "../../route.constants";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard, VehicleOwnerGuard)
export class GetVehicleReportController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Get(":id/report")
  run(@Param("id") id: string, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.vehicle_service.getVehicleReport({
      vehicle_id: id,
      profile_id: user.id,
    });
  }
}
