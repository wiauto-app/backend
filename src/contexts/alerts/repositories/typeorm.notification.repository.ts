import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { NotificationEntity } from "../entities/notification.entity";
import type { NotifyInput } from "../types/notify-input";
import type { PrimitiveNotification } from "../types/notification";

export type { PrimitiveNotification };

interface FindByProfileIdInput {
  profile_id: string;
  page: number;
  limit: number;
}

const entity_to_primitive = (
  entity: NotificationEntity,
): PrimitiveNotification => ({
  id: entity.id,
  profile_id: entity.profile_id,
  category: entity.category,
  title: entity.title,
  body: entity.body,
  data: entity.data,
  read_at: entity.read_at,
  created_at: entity.created_at,
});

@Injectable()
export class TypeOrmNotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notification_repository: Repository<NotificationEntity>,
  ) {}

  async createFromNotifyInput(
    input: NotifyInput,
  ): Promise<PrimitiveNotification> {
    const entity = this.notification_repository.create({
      profile_id: input.profile_id,
      category: input.category,
      title: input.title,
      body: input.body,
      data: input.data ?? null,
      read_at: null,
    });
    const saved = await this.notification_repository.save(entity);
    return entity_to_primitive(saved);
  }

  async findByProfileId(
    input: FindByProfileIdInput,
  ): Promise<PaginatedResult<PrimitiveNotification>> {
    const skip = (input.page - 1) * input.limit;

    const [rows, total] = await this.notification_repository
      .createQueryBuilder("notification")
      .where("notification.profile_id = :profile_id", {
        profile_id: input.profile_id,
      })
      .orderBy("notification.read_at", "ASC", "NULLS FIRST")
      .addOrderBy("notification.created_at", "DESC")
      .skip(skip)
      .take(input.limit)
      .getManyAndCount();

    return new PaginatedResult(
      rows.map(entity_to_primitive),
      total,
      input.page,
      input.limit,
    );
  }

  async findOneByIdAndProfileId(
    id: string,
    profile_id: string,
  ): Promise<PrimitiveNotification | null> {
    const row = await this.notification_repository.findOne({
      where: { id, profile_id },
    });
    if (!row) {
      return null;
    }
    return entity_to_primitive(row);
  }

  async markAsRead(
    notification: PrimitiveNotification,
  ): Promise<PrimitiveNotification> {
    if (notification.read_at) {
      return notification;
    }

    const preloaded = await this.notification_repository.preload({
      id: notification.id,
      read_at: new Date(),
    });

    if (!preloaded) {
      return notification;
    }

    const saved = await this.notification_repository.save(preloaded);
    return entity_to_primitive(saved);
  }

  async markAllAsRead(profile_id: string): Promise<{ updated: number }> {
    const unread = await this.notification_repository.find({
      where: { profile_id, read_at: IsNull() },
    });
    if (unread.length === 0) {
      return { updated: 0 };
    }

    const now = new Date();
    const to_save: NotificationEntity[] = [];
    for (const row of unread) {
      const preloaded = await this.notification_repository.preload({
        id: row.id,
        read_at: now,
      });
      if (preloaded) {
        to_save.push(preloaded);
      }
    }

    if (to_save.length === 0) {
      return { updated: 0 };
    }

    await this.notification_repository.save(to_save);
    return { updated: to_save.length };
  }
}
