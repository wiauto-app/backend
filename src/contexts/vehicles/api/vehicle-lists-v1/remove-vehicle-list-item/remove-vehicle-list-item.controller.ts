import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class RemoveVehicleListItemController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Delete(":list_id/items/:vehicle_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Param("vehicle_id", new ParseUUIDPipe()) vehicle_id: string,
  ) {
    return this.vehicle_lists_service.removeItem({
      list_id,
      profile_id,
      vehicle_id,
    });
  }
}
