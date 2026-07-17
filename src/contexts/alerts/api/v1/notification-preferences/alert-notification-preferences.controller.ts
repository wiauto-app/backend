import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";

import { GetUserId } from "@/src/contexts/auth/decorators/GetUserId.decorator";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { AlertNotificationService } from "@/src/contexts/alerts/services/alert-notification.service";

import { V1_ALERTS } from "../../route.constants";
import { UpdateAlertNotificationPreferencesHttpDto } from "./update-alert-notification-preferences.http-dto";

@Controller(`${V1_ALERTS}/notification-preferences`)
@UseGuards(JwtGuard)
export class AlertNotificationPreferencesController {
  constructor(
    private readonly alert_notification_service: AlertNotificationService,
  ) {}

  @Get()
  get(@GetUserId() profile_id: string) {
    return this.alert_notification_service.getPreferences({ profile_id });
  }

  @Patch()
  update(
    @GetUserId() profile_id: string,
    @Body() body: UpdateAlertNotificationPreferencesHttpDto,
  ) {
    return this.alert_notification_service.updatePreferences({
      profile_id,
      ...body,
    });
  }
}
