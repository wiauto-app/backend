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

  /** Devuelve el id de la notificación creada (o `null` si no aplica). */
  async send(input: NotifyInput): Promise<string | null> {
    if (!input.profile_id) {
      return null;
    }

    const notification =
      await this.notification_repository.createFromNotifyInput(input);
    this.notification_gateway.emitNew(notification);
    return notification.id;
  }
}
