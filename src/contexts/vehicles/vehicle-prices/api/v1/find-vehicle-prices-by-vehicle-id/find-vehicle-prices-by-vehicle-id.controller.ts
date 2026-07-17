import { Controller, Get, Param, UseGuards } from "@nestjs/common";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { V1_VEHICLES } from "@/src/contexts/vehicles/api/route.constants";

import { FindVehiclePricesByVehicleIdService } from "../../../services/find-vehicle-prices-by-vehicle-id.service";
import { FindVehiclePricesByVehicleIdParamsHttpDto } from "./find-vehicle-prices-by-vehicle-id.http-dto";

@Controller(V1_VEHICLES)
@UseGuards(JwtGuard)
export class FindVehiclePricesByVehicleIdController {
  constructor(
    private readonly find_vehicle_prices_by_vehicle_id_service: FindVehiclePricesByVehicleIdService,
  ) {}

  @Get(":vehicle_id/prices")
  async run(@Param() params: FindVehiclePricesByVehicleIdParamsHttpDto) {
    const prices = await this.find_vehicle_prices_by_vehicle_id_service.execute(
      params.vehicle_id,
    );
    return { prices };
  }
}
