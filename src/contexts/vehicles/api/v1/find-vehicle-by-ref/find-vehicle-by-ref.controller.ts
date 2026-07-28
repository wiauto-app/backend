import { Controller, Get, Param } from "@nestjs/common";

import {
  V1_VEHICLES,
  V1_VEHICLES_BY_REF,
} from "../../route.constants";
import { VehicleService } from "@/src/contexts/vehicles/services/vehicle.service";
import { FindVehicleByRefHttpDto } from "./find-vehicle-by-ref.http-dto";

@Controller(V1_VEHICLES)
export class FindVehicleByRefController {
  constructor(private readonly vehicle_service: VehicleService) {}

  @Get(`${V1_VEHICLES_BY_REF}/:ref`)
  run(@Param() params: FindVehicleByRefHttpDto) {
    return this.vehicle_service.findActiveIdByRef(params.ref);
  }
}
