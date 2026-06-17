import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { MarkAlertViewedUseCase } from "@/src/contexts/alerts/application/mark-alert-viewed-use-case/mark-alert-viewed.use-case";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class MarkAlertViewedController {
  constructor(private readonly mark_alert_viewed_use_case: MarkAlertViewedUseCase) {}

  @Post(":id/mark-viewed")
  run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
  ) {
    return this.mark_alert_viewed_use_case.execute({ alert_id, profile_id });
  }
}
