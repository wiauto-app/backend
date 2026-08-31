import { Controller, Get, Query, UseGuards } from "@nestjs/common";

import { GetOptionalUserId } from "@/src/contexts/auth/decorators/GetOptionalUserId.decorator";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";

import { V1_VEHICLES } from "../../route.constants";
import { FindAllVehiclesHttpDto } from "./find-all-vehicles.http-dto";

@Controller(V1_VEHICLES)
export class FindAllVehiclesController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  run(
    @Query() findAllVehiclesHttpDto: FindAllVehiclesHttpDto,
    @GetOptionalUserId() profile_id?: string,
  ) {
    console.log("findAllVehiclesHttpDto", findAllVehiclesHttpDto);
    return this.vehicle_service.findAll(findAllVehiclesHttpDto, profile_id);
  }
}