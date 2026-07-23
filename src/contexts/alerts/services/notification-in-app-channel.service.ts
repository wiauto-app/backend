import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { NotificationGateway } from "../gateways/notification.gateway";
import { TypeOrmNotificationRepository } from "../repositories/typeorm.notification.repository";
import type { NotifyInput } from "../types/notify-input";

@Injectable()
export class NotificationInAppChannelService {
  constructor(
    private readonly notification_repository: TypeOrmNotificationRepository,
    private readonly notification_gateway: NotificationGateway,
  ) {}

  async send(input: NotifyInput): Promise<void> {
    const notification =
      await this.notification_repository.createFromNotifyInput(input);
    this.notification_gateway.emitNew(notification);
  }
}
