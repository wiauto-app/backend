import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";
import { CreateAlertFromVehicleHttpDto } from "./create-alert-from-vehicle.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class CreateAlertFromVehicleController {
  constructor(private readonly alert_service: AlertService) {}

  @Post("from-vehicle/:vehicle_id")
  run(
    @GetUserId() profile_id: string,
    @Param("vehicle_id", ParseUUIDPipe) vehicle_id: string,
    @Body() body: CreateAlertFromVehicleHttpDto,
  ) {
    return this.alert_service.createFromVehicle({
      profile_id,
      vehicle_id,
      ...body,
    });
  }
}
