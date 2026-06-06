import { Module } from "@nestjs/common";

import { AuthModule } from "@/src/contexts/auth/auth.module";

import { FindVehiclePricesByVehicleIdUseCase } from "./application/find-vehicle-prices-by-vehicle-id-use-case/find-vehicle-prices-by-vehicle-id.use-case";
import { SetVehiclePriceUseCase } from "./application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { FindVehiclePricesByVehicleIdController } from "./infrastructure/http-api/v1/find-vehicle-prices-by-vehicle-id/find-vehicle-prices-by-vehicle-id.controller";
import { VehiclePricesPersistenceModule } from "./vehicle-prices-persistence.module";
import { VehicleSearchModule } from "../search/vehicle-search.module";

@Module({
  imports: [VehiclePricesPersistenceModule, VehicleSearchModule, AuthModule],
  controllers: [FindVehiclePricesByVehicleIdController],
  providers: [SetVehiclePriceUseCase, FindVehiclePricesByVehicleIdUseCase],
  exports: [
    SetVehiclePriceUseCase,
    FindVehiclePricesByVehicleIdUseCase,
    VehiclePricesPersistenceModule,
  ],
})
export class VehiclePricesModule {}
