import {
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertService } from "@/src/contexts/alerts/services/alert.service";

import { V1_ALERTS } from "../../route.constants";

@Controller(V1_ALERTS)
@UseGuards(JwtGuard)
export class DeleteAlertController {
  constructor(private readonly alert_service: AlertService) {}

  @Delete(":id")
  async run(
    @GetUserId() profile_id: string,
    @Param("id", ParseUUIDPipe) alert_id: string,
  ) {
    await this.alert_service.delete({ alert_id, profile_id });
    return { ok: true };
  }
}
