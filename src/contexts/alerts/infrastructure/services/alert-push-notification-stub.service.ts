import { Injectable, Logger } from "@nestjs/common";

import type { AlertEventNotificationPayload } from "../../domain/ports/alert-notification.port";
import { AlertPushNotificationPort } from "../../domain/ports/alert-notification.port";

@Injectable()
export class AlertPushNotificationStubService extends AlertPushNotificationPort {
  private readonly logger = new Logger(AlertPushNotificationStubService.name);

  async notify(payload: AlertEventNotificationPayload): Promise<void> {
    this.logger.log(
      `Push stub: ${payload.event_type} para ${payload.to} (sin envío real)`,
    );
  }
}
