import { Body, Controller, Post } from "@nestjs/common";

import { ImpressionsService } from "@/src/contexts/vehicles/services/impressions.service";

import { V1_VEHICLES, V1_VEHICLES_IMPRESSIONS } from "../../route.constants";
import { RecordVehicleImpressionsBodyHttpDto } from "./record-vehicle-impressions.http-dto";

@Controller(V1_VEHICLES)
export class RecordVehicleImpressionsController {
  constructor(private readonly impressions_service: ImpressionsService) {}

  @Post(V1_VEHICLES_IMPRESSIONS)
  record(@Body() body: RecordVehicleImpressionsBodyHttpDto) {
    return this.impressions_service.recordBatch({
      vehicle_ids: body.vehicle_ids,
      profile_id: body.profile_id ?? null,
    });
  }
}
