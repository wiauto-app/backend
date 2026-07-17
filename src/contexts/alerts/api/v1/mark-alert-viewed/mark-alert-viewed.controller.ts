import {
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class MarkAlertViewedController {
  constructor(private readonly alert_service: AlertService) {}

  @Post(":id/mark-viewed")
  run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
  ) {
    return this.alert_service.markViewed({ alert_id, profile_id });
  }
}
