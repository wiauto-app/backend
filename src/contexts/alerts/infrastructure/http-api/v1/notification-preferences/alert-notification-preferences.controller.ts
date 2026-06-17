import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { GetAlertNotificationPreferencesUseCase } from "@/src/contexts/alerts/application/get-alert-notification-preferences-use-case/get-alert-notification-preferences.use-case";
import { UpdateAlertNotificationPreferencesUseCase } from "@/src/contexts/alerts/application/update-alert-notification-preferences-use-case/update-alert-notification-preferences.use-case";

import { V1_ALERTS } from "../../route.constants";
import { UpdateAlertNotificationPreferencesHttpDto } from "./update-alert-notification-preferences.http-dto";

@Controller(`${V1_ALERTS}/notification-preferences`)
@UseGuards(JwtGuard)
export class AlertNotificationPreferencesController {
  constructor(
    private readonly get_alert_notification_preferences_use_case: GetAlertNotificationPreferencesUseCase,
    private readonly update_alert_notification_preferences_use_case: UpdateAlertNotificationPreferencesUseCase,
  ) {}

  @Get()
  get(@GetUserId() profile_id: string) {
    return this.get_alert_notification_preferences_use_case.execute({ profile_id });
  }

  @Patch()
  update(
    @GetUserId() profile_id: string,
    @Body() body: UpdateAlertNotificationPreferencesHttpDto,
  ) {
    return this.update_alert_notification_preferences_use_case.execute({
      profile_id,
      ...body,
    });
  }
}
