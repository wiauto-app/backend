import { Controller, Get, Param } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "./find-vehicle.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";

@Controller(V1_VEHICLES)
export class FindVehicleController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Get(":id")
  run(@Param() findVehicleHttpDto: FindVehicleHttpDto) {
    return this.vehicle_service.findOne(findVehicleHttpDto);
  }
}
