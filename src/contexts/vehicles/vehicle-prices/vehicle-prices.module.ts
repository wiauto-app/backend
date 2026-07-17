import { Module } from "@nestjs/common";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { AlertProcessingEnqueueModule } from "@/src/contexts/alerts/queues/alert-processing-enqueue.module";

import { FindVehiclePricesByVehicleIdService } from "./services/find-vehicle-prices-by-vehicle-id.service";
import { SetVehiclePriceService } from "./services/set-vehicle-price.service";
import { FindVehiclePricesByVehicleIdController } from "./api/v1/find-vehicle-prices-by-vehicle-id/find-vehicle-prices-by-vehicle-id.controller";
import { VehiclePricesPersistenceModule } from "./vehicle-prices-persistence.module";
import { VehicleSearchModule } from "../search/vehicle-search.module";

@Module({
  imports: [
    VehiclePricesPersistenceModule,
    VehicleSearchModule,
    AuthModule,
    AlertProcessingEnqueueModule,
  ],
  controllers: [FindVehiclePricesByVehicleIdController],
  providers: [SetVehiclePriceService, FindVehiclePricesByVehicleIdService],
  exports: [
    SetVehiclePriceService,
    FindVehiclePricesByVehicleIdService,
    VehiclePricesPersistenceModule,
  ],
})
export class VehiclePricesModule {}
