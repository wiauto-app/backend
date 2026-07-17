import { Body, Controller, Get, Post } from "@nestjs/common";

import { SimulateFinancingHttpDto } from "../dto/simulate-financing.http-dto";
import { FinancingSimulatorService } from "../services/financing-simulator.service";
import { V1_FINANCING_SIMULATOR } from "./route.constants";

@Controller(V1_FINANCING_SIMULATOR)
export class FinancingSimulatorController {
  constructor(
    private readonly financingSimulatorService: FinancingSimulatorService,
  ) {}

  @Get("config")
  getConfig() {
    return this.financingSimulatorService.getConfig();
  }

  @Post("simulate")
  simulate(@Body() body: SimulateFinancingHttpDto) {
    return this.financingSimulatorService.simulate(body);
  }
}
