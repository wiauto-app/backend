import { Body, Controller, Post } from "@nestjs/common";
import { V1_VEHICLE_CREATOR_ROUTES } from "./route.constants";
import { VehicleCreatorService } from "./vehicle-creator.service";
import { VehicleCreatorDto } from "./dto/vehicle-creator.dto";


@Controller(V1_VEHICLE_CREATOR_ROUTES.CREATE_VEHICLE)
export class VehicleCreatorController {

  constructor(
    private readonly vehicleCreatorService: VehicleCreatorService,
  ) {}

  @Post()
  async createVehicle(@Body() body: VehicleCreatorDto) {
    return this.vehicleCreatorService.createVehicle(body);
  }
}