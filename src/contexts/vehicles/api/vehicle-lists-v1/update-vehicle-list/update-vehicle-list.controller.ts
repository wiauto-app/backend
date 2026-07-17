import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { UpdateVehicleListHttpDto } from "./update-vehicle-list.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class UpdateVehicleListController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Patch(":list_id")
  run(
    @GetUserId() profile_id: string,
    @Param("list_id", new ParseUUIDPipe()) list_id: string,
    @Body() body: UpdateVehicleListHttpDto,
  ) {
    return this.vehicle_lists_service.update({
      list_id,
      profile_id,
      name: body.name,
      description: body.description,
      is_default: body.is_default,
    });
  }
}
