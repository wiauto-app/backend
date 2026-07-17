import { Controller, Get, UseGuards } from "@nestjs/common";
import { VehicleListsService } from "@/src/contexts/vehicles/services/vehicle-lists.service";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_VEHICLE_LISTS } from "../../route.constants";

@Controller(V1_VEHICLE_LISTS)
@UseGuards(JwtGuard)
export class FindAllVehicleListsController {
  constructor(private readonly vehicle_lists_service: VehicleListsService) {}

  @Get()
  run(@GetUserId() profile_id: string) {
    return this.vehicle_lists_service.findAll(profile_id);
  }
}
