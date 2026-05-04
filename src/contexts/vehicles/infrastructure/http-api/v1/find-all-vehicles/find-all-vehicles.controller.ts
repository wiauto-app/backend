import { Controller, Get, Query } from "@nestjs/common";
import { V1_VEHICLES } from "../../route.constants";
import { FindAllVehiclesHttpDto } from "./find-all-vehicles.http-dto";
import { FindAllVehiclesUseCase } from "@/src/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";
@Controller(V1_VEHICLES)
export class FindAllVehiclesController {
  constructor(private readonly findAllVehiclesUseCase: FindAllVehiclesUseCase) {}

  @Get()
  run(@Query() findAllVehiclesHttpDto: FindAllVehiclesHttpDto) {
    return this.findAllVehiclesUseCase.execute(findAllVehiclesHttpDto);
  }
}