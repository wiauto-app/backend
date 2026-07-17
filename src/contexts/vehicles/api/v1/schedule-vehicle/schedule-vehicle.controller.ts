import { Body, Controller, Param, Patch } from "@nestjs/common";

import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";
import { ScheduleVehicleHttpDto } from "./schedule-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class ScheduleVehicleController {
  constructor(
    private readonly vehicle_service: VehicleService,
  ) {}

  @Patch(":id/schedule")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string, @Body() body: ScheduleVehicleHttpDto) {
    return this.vehicle_service.schedule({
      vehicle_id: id,
      scheduled_publish_at: body.scheduled_publish_at,
    });
  }
}
