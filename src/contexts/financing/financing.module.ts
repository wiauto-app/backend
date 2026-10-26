import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BillingModule } from "@/src/contexts/billing/billing.module";
import { DealershipInvitationModule } from "@/src/contexts/dealership/modules/dealership-invitation.module";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehiclePriceEntity } from "@/src/contexts/vehicles/vehicle-prices/entities/vehicle-price.entity";

import { DealershipFinancingStatusController } from "./api/dealership-financing-status.controller";
import { DealershipFinancingSettingsController } from "./api/dealership-financing-settings.controller";
import { FinancingSimulatorController } from "./api/financing-simulator.controller";
import { VehicleFinancingQuoteController } from "./api/vehicle-financing-quote.controller";
import { DealershipFinancingSettingsEntity } from "./entities/dealership-financing-settings.entity";
import { DealershipFinancingService } from "./services/dealership-financing.service";
import { FinancingSimulatorService } from "./services/financing-simulator.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DealershipFinancingSettingsEntity,
      VehicleEntity,
      VehiclePriceEntity,
    ]),
    DealershipInvitationModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [
    FinancingSimulatorController,
    DealershipFinancingSettingsController,
    DealershipFinancingStatusController,
    VehicleFinancingQuoteController,
  ],
  providers: [FinancingSimulatorService, DealershipFinancingService],
  exports: [FinancingSimulatorService, DealershipFinancingService],
})
export class FinancingModule {}
