import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_VEHICLES } from "@/src/contexts/vehicles/infrastructure/http-api/route.constants";

import { FindVehiclePricesByVehicleIdUseCase } from "../../../../application/find-vehicle-prices-by-vehicle-id-use-case/find-vehicle-prices-by-vehicle-id.use-case";
import { FindVehiclePricesByVehicleIdParamsHttpDto } from "./find-vehicle-prices-by-vehicle-id.http-dto";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class FindVehiclePricesByVehicleIdController {
  constructor(
    private readonly find_vehicle_prices_by_vehicle_id_use_case: FindVehiclePricesByVehicleIdUseCase,
  ) {}

  @Get(":vehicle_id/prices")
  async run(@Param() params: FindVehiclePricesByVehicleIdParamsHttpDto) {
    const prices = await this.find_vehicle_prices_by_vehicle_id_use_case.execute(
      params.vehicle_id,
    );
    return { prices };
  }
}
