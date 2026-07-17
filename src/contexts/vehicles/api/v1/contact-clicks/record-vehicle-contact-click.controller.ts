import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { ContactClicksService } from "@/src/contexts/vehicles/services/contact-clicks.service";
import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";

import { V1_VEHICLES } from "../../route.constants";
import {
  RecordVehicleContactClickBodyHttpDto,
  RecordVehicleContactClickParamsHttpDto,
} from "./record-vehicle-contact-click.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleContactClickController {
  constructor(private readonly contact_clicks_service: ContactClicksService) {}

  @Post(":vehicle_id/contact-clicks")
  @UseGuards(OptionalJwtGuard)
  record(
    @Param() params: RecordVehicleContactClickParamsHttpDto,
    @Body() body: RecordVehicleContactClickBodyHttpDto,
    @GetOptionalUserId() profile_id?: string,
  ) {
    return this.contact_clicks_service.record({
      vehicle_id: params.vehicle_id,
      type: body.type,
      profile_id,
    });
  }
}
