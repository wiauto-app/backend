import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { RecordVehicleContactClickUseCase } from "@/src/contexts/vehicles/application/contact-click-use-cases/record-vehicle-contact-click.use-case";
import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";

import { V1_VEHICLES } from "../../route.constants";
import {
  RecordVehicleContactClickBodyHttpDto,
  RecordVehicleContactClickParamsHttpDto,
} from "./record-vehicle-contact-click.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleContactClickController {
  constructor(
    private readonly record_vehicle_contact_click_use_case: RecordVehicleContactClickUseCase,
  ) {}

  @Post(":vehicle_id/contact-clicks")
  @UseGuards(OptionalJwtGuard)
  record(
    @Param() params: RecordVehicleContactClickParamsHttpDto,
    @Body() body: RecordVehicleContactClickBodyHttpDto,
    @GetOptionalUserId() profile_id?: string,
  ) {
    return this.record_vehicle_contact_click_use_case.execute({
      vehicle_id: params.vehicle_id,
      type: body.type,
      profile_id,
    });
  }
}
