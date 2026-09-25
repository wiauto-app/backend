import { Controller, Get, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { V1_PROACTIVE_ALERTS, V1_PROACTIVE_ALERTS_SETTINGS } from "../route.constants";
import { ProactiveAlertSettingsService } from "../../services/proactive-alert-settings.service";

@Controller(`${V1_PROACTIVE_ALERTS}/${V1_PROACTIVE_ALERTS_SETTINGS}`)
@UseGuards(JwtGuard)
export class GetProactiveAlertSettingsController {
  constructor(
    private readonly proactive_alert_settings_service: ProactiveAlertSettingsService,
  ) {}

  @Get()
  getSettings(@GetUserId() profile_id: string) {
    return this.proactive_alert_settings_service.getForProfile(profile_id);
  }
}
