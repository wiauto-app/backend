import { CreateVehicleAuth } from "@/src/contexts/vehicles/decorators/create-vehicle-auth.decorator";
import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";
import { readGuestId } from "@/src/contexts/vehicles/vehicle-images/guest/guest-upload-identity";

import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleDto } from "./create-vehicle.http-dto";
import { CreateVehicleService } from "./create-vehicle.service";

@Controller(V1_VEHICLES)
export class CreateVehicleController {
  constructor(private readonly create_vehicle_service: CreateVehicleService) {}

  @Post()
  @CreateVehicleAuth()
  run(
    @Body() dto: CreateVehicleDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    // Permite reclamar las fotos subidas como invitado antes del login
    return this.create_vehicle_service.create(dto, user.id, readGuestId(req));
  }
}
