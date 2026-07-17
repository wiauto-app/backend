import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";
import { UpdateAlertHttpDto } from "./update-alert.http-dto";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class UpdateAlertController {
  constructor(private readonly alert_service: AlertService) {}

  @Patch(":id")
  run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
    @Body() body: UpdateAlertHttpDto,
  ) {
    return this.alert_service.update({
      ...body,
      alert_id,
      profile_id,
    });
  }
}
