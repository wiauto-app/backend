import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { CreateVehicleAuth } from "@/src/contexts/vehicles/decorators/create-vehicle-auth.decorator";
import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { Request } from "express";

import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleHttpDto } from "./create-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class CreateVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Post()
  @CreateVehicleAuth()
  run(
    @Body() createVehicleHttpDto: CreateVehicleHttpDto,
    @Req() req: Request,
  ) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    return this.vehicle_service.create(
      {
        ...createVehicleHttpDto,
        description: createVehicleHttpDto.description ?? "",
      },
      user.id,
    );
  }
}
