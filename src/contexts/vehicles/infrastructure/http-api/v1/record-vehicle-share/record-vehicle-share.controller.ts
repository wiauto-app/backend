import { RecordVehicleShareUseCase } from "@/src/contexts/vehicles/application/share-use-cases/record-vehicle-share-use-case/record-vehicle-share.use-case";
import { Body, Controller, Param, Post } from "@nestjs/common";

import { V1_VEHICLES } from "../../route.constants";
import {
  RecordVehicleShareBodyHttpDto,
  RecordVehicleShareParamsHttpDto,
} from "./record-vehicle-share.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleShareController {
  constructor(
    private readonly record_vehicle_share_use_case: RecordVehicleShareUseCase,
  ) {}

  @Post(":vehicle_id/shares")
  record(
    @Param() params: RecordVehicleShareParamsHttpDto,
    @Body() body: RecordVehicleShareBodyHttpDto,
  ) {
    return this.record_vehicle_share_use_case.execute({
      vehicle_id: params.vehicle_id,
      user_id: body.user_id ?? null,
      platform: body.platform,
      source: body.source,
    });
  }
}
