import { Controller, Get, Param } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { FindVehicleHttpDto } from "./find-vehicle.http-dto";
import { GetVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/get-vehicle-use-case/get-vehicle.use-case";

@Controller(V1_VEHICLES)
export class FindVehicleController {

  constructor(
    private readonly getVehicleUseCase: GetVehicleUseCase
  ) { }

  @Get(":id")
  run(@Param() findVehicleHttpDto: FindVehicleHttpDto) {
    return this.getVehicleUseCase.execute(findVehicleHttpDto);
  }
}