import { AuthModule } from "@/src/contexts/auth/auth.module";
import { BillingModule } from "@/src/contexts/billing/billing.module";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { VehicleEntity } from "../entities/vehicle.entity";
import { DismissVehicleController } from "./api/v1/dismiss/dismiss-vehicle.controller";
import { FindAllDismissedVehiclesController } from "./api/v1/dismissed-vehicles/find-all-dismissed-vehicles.controller";
import { PriceWatchController } from "./api/v1/price-watch/price-watch.controller";
import { DismissedVehicleEntity } from "./entities/dismissed-vehicle.entity";
import { VehiclePriceWatchEntity } from "./entities/vehicle-price-watch.entity";
import { DismissedVehiclesService } from "./services/dismissed-vehicles.service";
import { VehiclePriceWatchService } from "./services/vehicle-price-watch.service";
import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VehiclePriceWatchEntity,
      DismissedVehicleEntity,
      VehicleEntity,
      ProfileEntity,
    ]),
    AuthModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [
    PriceWatchController,
    DismissVehicleController,
    FindAllDismissedVehiclesController,
  ],
  providers: [VehiclePriceWatchService, DismissedVehiclesService],
  exports: [VehiclePriceWatchService, DismissedVehiclesService],
})
export class VehicleEngagementModule {}
