import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { NotFoundException } from "@nestjs/common";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import {
  PrimitiveNotification,
  TypeOrmNotificationRepository,
} from "../repositories/typeorm.notification.repository";

export interface FindInboxNotificationsDto {
  profile_id: string;
  page?: number;
  limit?: number;
}

export interface MarkNotificationReadDto {
  profile_id: string;
  notification_id: string;
}

export interface MarkAllNotificationsReadDto {
  profile_id: string;
}

@Injectable()
export class NotificationInboxService {
  constructor(
    private readonly notification_repository: TypeOrmNotificationRepository,
  ) {}

  async findAll(
    dto: FindInboxNotificationsDto,
  ): Promise<PaginatedResult<PrimitiveNotification>> {
    const page = dto.page && dto.page > 0 ? dto.page : 1;
    const limit = dto.limit && dto.limit > 0 ? Math.min(dto.limit, 100) : 20;

    return this.notification_repository.findByProfileId({
      profile_id: dto.profile_id,
      page,
      limit,
    });
  }

  async markAsRead(
    dto: MarkNotificationReadDto,
  ): Promise<PrimitiveNotification> {
    const notification =
      await this.notification_repository.findOneByIdAndProfileId(
        dto.notification_id,
        dto.profile_id,
      );

    if (!notification) {
      throw new NotFoundException(
        `Notificación con id ${dto.notification_id} no encontrada`,
      );
    }

    return this.notification_repository.markAsRead(notification);
  }

  async markAllAsRead(
    dto: MarkAllNotificationsReadDto,
  ): Promise<{ updated: number }> {
    return this.notification_repository.markAllAsRead(dto.profile_id);
  }
}
