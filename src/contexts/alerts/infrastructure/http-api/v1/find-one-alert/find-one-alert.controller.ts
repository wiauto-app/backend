import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { FindOneAlertUseCase } from "@/src/contexts/alerts/application/find-one-alert-use-case/find-one-alert.use-case";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class FindOneAlertController {
  constructor(private readonly find_one_alert_use_case: FindOneAlertUseCase) {}

  @Get(":id")
  run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
  ) {
    return this.find_one_alert_use_case.execute({ alert_id, profile_id });
  }
}
