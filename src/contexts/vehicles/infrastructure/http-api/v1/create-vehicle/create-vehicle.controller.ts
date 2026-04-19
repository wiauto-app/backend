import { Body, Controller, Post } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleUseCase } from "@/src/contexts/vehicles/application/create-vehicle-use-case/create-vehicle.use-case";
import { CreateVehicleHttpDto } from "./create-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class CreateVehicleController {

  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase
  ) { }

  @Post()
  run(@Body() createVehicleHttpDto: CreateVehicleHttpDto) {
    return this.createVehicleUseCase.execute(createVehicleHttpDto);
  }
}