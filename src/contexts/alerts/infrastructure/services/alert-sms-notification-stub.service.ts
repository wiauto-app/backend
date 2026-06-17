import { Injectable, Logger } from "@nestjs/common";

import type { AlertEventNotificationPayload } from "../../domain/ports/alert-notification.port";
import { AlertSmsNotificationPort } from "../../domain/ports/alert-notification.port";

@Injectable()
export class AlertSmsNotificationStubService extends AlertSmsNotificationPort {
  private readonly logger = new Logger(AlertSmsNotificationStubService.name);

  async notify(payload: AlertEventNotificationPayload): Promise<void> {
    this.logger.log(
      `SMS stub: ${payload.event_type} para ${payload.to} (sin envío real)`,
    );
  }
}
