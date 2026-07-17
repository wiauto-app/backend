import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";
import { CreateVehicleListHttpDto } from "./create-vehicle-list.http-dto";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class CreateVehicleListController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Post()
  run(
    @GetUserId() profile_id: string,
    @Body() body: CreateVehicleListHttpDto,
  ) {
    return this.vehicle_lists_service.create({
      profile_id,
      name: body.name,
      description: body.description,
      is_default: body.is_default,
    });
  }
}
