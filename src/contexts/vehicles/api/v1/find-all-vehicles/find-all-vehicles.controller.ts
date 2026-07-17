import { Controller, Get, Query } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { FindAllVehiclesHttpDto } from "./find-all-vehicles.http-dto";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
@Controller(V1_VEHICLES)
export class FindAllVehiclesController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Get()
  run(@Query() findAllVehiclesHttpDto: FindAllVehiclesHttpDto) {
    return this.vehicle_service.findAll(findAllVehiclesHttpDto);
  }
}