import { Body, Controller, Param, Patch } from "@nestjs/common";

import { ScheduleVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/schedule-vehicle-use-case/schedule-vehicle.use-case";
import { OwnerVehicleActionAuth } from "../../../decorators/owner-vehicle-auth.decorator";
import { V1_VEHICLES } from "../../route.constants";
import { ScheduleVehicleHttpDto } from "./schedule-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class ScheduleVehicleController {
  constructor(
    private readonly schedule_vehicle_use_case: ScheduleVehicleUseCase,
  ) {}

  @Patch(":id/schedule")
  @OwnerVehicleActionAuth()
  run(@Param("id") id: string, @Body() body: ScheduleVehicleHttpDto) {
    return this.schedule_vehicle_use_case.execute({
      vehicle_id: id,
      scheduled_publish_at: body.scheduled_publish_at,
    });
  }
}
