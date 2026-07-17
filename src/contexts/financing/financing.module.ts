import { Module } from "@nestjs/common";

import { FinancingSimulatorController } from "./api/financing-simulator.controller";
import { FinancingSimulatorService } from "./services/financing-simulator.service";

@Module({
  controllers: [FinancingSimulatorController],
  providers: [FinancingSimulatorService],
  exports: [FinancingSimulatorService],
})
export class FinancingModule {}
