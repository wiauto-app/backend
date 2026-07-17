import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { V1_VEHICLES, V1_VEHICLES_MINE } from "../../route.constants";
import { FindOwnerVehiclesHttpDto } from "./find-owner-vehicles.http-dto";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class FindOwnerVehiclesController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Get(V1_VEHICLES_MINE)
  run(@Query() query: FindOwnerVehiclesHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.vehicle_service.findOwnerVehicles({
      profile_id: user.id,
      ...query,
    });
  }
}
