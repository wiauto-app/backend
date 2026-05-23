import { CreateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/create-vehicle-use-case/create-vehicle.use-case";
import { CreateVehicleAuth } from "@/src/contexts/vehicles/infrastructure/decorators/create-vehicle-auth.decorator";
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
  constructor(private readonly createVehicleUseCase: CreateVehicleUseCase) {}

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
    return this.createVehicleUseCase.execute(
      createVehicleHttpDto,
      user.id,
    );
  }
}
