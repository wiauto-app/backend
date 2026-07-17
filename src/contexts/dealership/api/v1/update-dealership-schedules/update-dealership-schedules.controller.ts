import { Body, Controller, Param, Put } from "@nestjs/common";

import { AuthPermissions } from "@/src/contexts/users/permissions/decorators/authPermission.decorator";

import { DealershipTeamManagerGuard } from "../../../guards/dealership-team-manager.guard";
import { DealershipScheduleService } from "../../../services/dealership-schedule.service";
import { V1_DEALERSHIPS } from "../../route.constants";
import { FindDealershipHttpDto } from "../find-one-dealership/find-one-dealership.http-dto";
import { UpdateDealershipSchedulesHttpDto } from "./update-dealership-schedules.http-dto";

@Controller(V1_DEALERSHIPS)
export class UpdateDealershipSchedulesController {
  constructor(
    private readonly dealership_schedule_service: DealershipScheduleService,
  ) {}

  @Put(":id/schedules")
  @AuthPermissions({
    permissions: [],
    extraGuards: [DealershipTeamManagerGuard],
  })
  run(
    @Param() params: FindDealershipHttpDto,
    @Body() body: UpdateDealershipSchedulesHttpDto,
  ) {
    return this.dealership_schedule_service.replaceAll({
      dealership_id: params.id,
      schedules: body.schedules.map((schedule) => ({
        day: schedule.day,
        open_times: schedule.open_times.map((slot) => ({
          open_time: slot.open_time,
          close_time: slot.close_time,
        })),
      })),
    });
  }
}
