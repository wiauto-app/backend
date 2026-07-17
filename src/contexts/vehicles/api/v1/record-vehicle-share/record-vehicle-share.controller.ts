import { Body, Controller, Param, Post } from "@nestjs/common";

import { SharesService } from "@/src/contexts/vehicles/services/shares.service";

import { V1_VEHICLES } from "../../route.constants";
import {
  RecordVehicleShareBodyHttpDto,
  RecordVehicleShareParamsHttpDto,
} from "./record-vehicle-share.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleShareController {
  constructor(private readonly shares_service: SharesService) {}

  @Post(":vehicle_id/shares")
  record(
    @Param() params: RecordVehicleShareParamsHttpDto,
    @Body() body: RecordVehicleShareBodyHttpDto,
  ) {
    return this.shares_service.record({
      vehicle_id: params.vehicle_id,
      user_id: body.user_id ?? null,
      platform: body.platform,
      source: body.source,
    });
  }
}
