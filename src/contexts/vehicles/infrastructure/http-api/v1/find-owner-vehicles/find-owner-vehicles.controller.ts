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
import { FindOwnerVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-owner-vehicles-use-case/find-owner-vehicles.use-case";
import { V1_VEHICLES, V1_VEHICLES_MINE } from "../../route.constants";
import { FindOwnerVehiclesHttpDto } from "./find-owner-vehicles.http-dto";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class FindOwnerVehiclesController {
  constructor(
    private readonly find_owner_vehicles_use_case: FindOwnerVehiclesUseCase,
  ) {}

  @Get(V1_VEHICLES_MINE)
  run(@Query() query: FindOwnerVehiclesHttpDto, @Req() req: Request) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.find_owner_vehicles_use_case.execute({
      profile_id: user.id,
      ...query,
    });
  }
}
