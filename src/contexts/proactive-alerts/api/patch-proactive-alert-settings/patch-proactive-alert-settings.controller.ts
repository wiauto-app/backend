import { Body, Controller, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { RequireEntitlement } from "@/src/contexts/billing/decorators/require-entitlement.decorator";
import { ENTITLEMENT_FEATURE } from "@/src/contexts/billing/types/entitlement-features";

import { V1_PROACTIVE_ALERTS, V1_PROACTIVE_ALERTS_SETTINGS } from "../route.constants";
import { ProactiveAlertSettingsService } from "../../services/proactive-alert-settings.service";
import type { ProactiveAlertType } from "../../constants/proactive-alert-types";
import { PatchProactiveAlertSettingsHttpDto } from "./patch-proactive-alert-settings.http-dto";

@Controller(`${V1_PROACTIVE_ALERTS}/${V1_PROACTIVE_ALERTS_SETTINGS}`)
@UseGuards(JwtGuard)
export class PatchProactiveAlertSettingsController {
  constructor(
    private readonly proactive_alert_settings_service: ProactiveAlertSettingsService,
  ) {}

  @Patch()
  @RequireEntitlement(ENTITLEMENT_FEATURE.PROACTIVE_ALERTS)
  patchSettings(
    @GetUserId() profile_id: string,
    @Body() body: PatchProactiveAlertSettingsHttpDto,
  ) {
    return this.proactive_alert_settings_service.patch(
      profile_id,
      body.enabled_types as ProactiveAlertType[],
    );
  }
}
