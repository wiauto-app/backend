import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { CreateAlertFromVehicleUseCase } from "@/src/contexts/alerts/application/create-alert-from-vehicle-use-case/create-alert-from-vehicle.use-case";

import { V1_ALERTS } from "../../route.constants";
import { CreateAlertFromVehicleHttpDto } from "./create-alert-from-vehicle.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class CreateAlertFromVehicleController {
  constructor(
    private readonly create_alert_from_vehicle_use_case: CreateAlertFromVehicleUseCase,
  ) {}

  @Post("from-vehicle/:vehicle_id")
  run(
    @GetUserId() profile_id: string,
    @Param("vehicle_id", ParseUUIDPipe) vehicle_id: string,
    @Body() body: CreateAlertFromVehicleHttpDto,
  ) {
    return this.create_alert_from_vehicle_use_case.execute({
      profile_id,
      vehicle_id,
      ...body,
    });
  }
}
