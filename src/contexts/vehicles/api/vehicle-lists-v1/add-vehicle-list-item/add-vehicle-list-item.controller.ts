import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { AddVehicleListItemHttpDto } from "./add-vehicle-list-item.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class AddVehicleListItemController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Post(":list_id/items")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Body() body: AddVehicleListItemHttpDto,
  ) {
    return this.vehicle_lists_service.addItem({
      list_id,
      profile_id,
      vehicle_id: body.vehicle_id,
    });
  }
}
