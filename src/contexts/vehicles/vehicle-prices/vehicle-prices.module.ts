import { Module } from "@nestjs/common";

import { FindVehiclePricesByVehicleIdUseCase } from "./application/find-vehicle-prices-by-vehicle-id-use-case/find-vehicle-prices-by-vehicle-id.use-case";
import { SetVehiclePriceUseCase } from "./application/set-vehicle-price-use-case/set-vehicle-price.use-case";
import { VehiclePricesPersistenceModule } from "./vehicle-prices-persistence.module";
import { VehicleSearchModule } from "../search/vehicle-search.module";

@Module({
  imports: [VehiclePricesPersistenceModule, VehicleSearchModule],
  providers: [SetVehiclePriceUseCase, FindVehiclePricesByVehicleIdUseCase],
  exports: [
    SetVehiclePriceUseCase,
    FindVehiclePricesByVehicleIdUseCase,
    VehiclePricesPersistenceModule,
  ],
})
export class VehiclePricesModule {}
