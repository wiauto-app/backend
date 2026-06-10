import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindAllAlertsUseCase } from "@/src/contexts/alerts/application/find-all-alerts-use-case/find-all-alerts.use-case";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class FindAllAlertsController {
  constructor(private readonly find_all_alerts_use_case: FindAllAlertsUseCase) {}

  @Get()
  run(@GetUserId() profile_id: string) {
    return this.find_all_alerts_use_case.execute({ profile_id });
  }
}
