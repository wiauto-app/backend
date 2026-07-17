import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ALERT_EVENT_TYPE } from "../types/alert-event-type.enum";
import type { AlertEventType } from "../types/alert-event-type.enum";
import { ALERT_NOTIFICATION_EVENT_STATUS } from "../types/alert-notification-event-status.enum";
import { AlertNotificationEvent } from "../types/alert-notification-event";
import { AlertNotificationEventEntity } from "../entities/alert-notification-event.entity";
import { VehicleListItemEntity } from "@/src/contexts/vehicles/entities/vehicle-list-item.entity";

const entity_to_domain = (
  entity: AlertNotificationEventEntity,
): AlertNotificationEvent =>
  AlertNotificationEvent.fromPrimitives({
    id: entity.id,
    profile_id: entity.profile_id,
    alert_id: entity.alert_id,
    vehicle_id: entity.vehicle_id,
    event_type: entity.event_type,
    channel: entity.channel,
    status: entity.status,
    scheduled_for: entity.scheduled_for,
    sent_at: entity.sent_at,
    payload: entity.payload,
    created_at: entity.created_at,
  });

@Injectable()
export class TypeOrmAlertNotificationEventRepository {
  constructor(
    @InjectRepository(AlertNotificationEventEntity)
    private readonly repository: Repository<AlertNotificationEventEntity>,
    @InjectRepository(VehicleListItemEntity)
    private readonly vehicle_list_item_repository: Repository<VehicleListItemEntity>,
  ) {
  }

  async save(event: AlertNotificationEvent): Promise<void> {
    const primitive = event.toPrimitives();
    await this.repository.save(
      this.repository.create({
        id: primitive.id,
        profile_id: primitive.profile_id,
        alert_id: primitive.alert_id,
        vehicle_id: primitive.vehicle_id,
        event_type: primitive.event_type,
        channel: primitive.channel,
        status: primitive.status,
        scheduled_for: primitive.scheduled_for,
        sent_at: primitive.sent_at,
        payload: primitive.payload,
        created_at: primitive.created_at,
      }),
    );
  }

  async update(event: AlertNotificationEvent): Promise<void> {
    const primitive = event.toPrimitives();
    const preloaded = await this.repository.preload({
      id: primitive.id,
      status: primitive.status,
      sent_at: primitive.sent_at,
      scheduled_for: primitive.scheduled_for,
      payload: primitive.payload,
    });

    if (!preloaded) {
      return;
    }

    await this.repository.save(preloaded);
  }

  async findDuplicate(params: {
    alert_id: string;
    vehicle_id: string;
    event_type: AlertEventType;
  }): Promise<AlertNotificationEvent | null> {
    const row = await this.repository.findOne({
      where: {
        alert_id: params.alert_id,
        vehicle_id: params.vehicle_id,
        event_type: params.event_type,
      },
    });
    if (!row) {
      return null;
    }
    return entity_to_domain(row);
  }

  async countNewListingsSince(params: {
    alert_id: string;
    since: Date;
  }): Promise<number> {
    return this.repository
      .createQueryBuilder("event")
      .where("event.alert_id = :alert_id", { alert_id: params.alert_id })
      .andWhere("event.event_type = :event_type", {
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      })
      .andWhere("event.created_at > :since", { since: params.since })
      .getCount();
  }

  async findPendingByProfileId(
    profile_id: string,
  ): Promise<AlertNotificationEvent[]> {
    const rows = await this.repository.find({
      where: {
        profile_id,
        status: ALERT_NOTIFICATION_EVENT_STATUS.PENDING,
      },
      order: { created_at: "ASC" },
    });
    return rows.map((row) => entity_to_domain(row));
  }

  async findPendingForDigest(params: {
    frequency: "daily" | "weekly";
    before: Date;
  }): Promise<AlertNotificationEvent[]> {
    const rows = await this.repository
      .createQueryBuilder("event")
      .innerJoin(
        "alert_notification_preferences",
        "prefs",
        "prefs.profile_id = event.profile_id",
      )
      .where("event.status = :status", {
        status: ALERT_NOTIFICATION_EVENT_STATUS.PENDING,
      })
      .andWhere("event.scheduled_for <= :before", { before: params.before })
      .andWhere("prefs.frequency = :frequency", { frequency: params.frequency })
      .orderBy("event.profile_id", "ASC")
      .addOrderBy("event.created_at", "ASC")
      .getMany();

    return rows.map((row) => entity_to_domain(row));
  }

  async findStaleFavoriteItems(params: {
    reminder_days: number;
    reference_date: Date;
  }): Promise<
    Array<{
      profile_id: string;
      vehicle_id: string;
      added_at: Date;
    }>
  > {
    const cutoff = new Date(params.reference_date);
    cutoff.setDate(cutoff.getDate() - params.reminder_days);

    const rows = await this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .innerJoin("item.vehicle_list", "list")
      .select("list.profile_id", "profile_id")
      .addSelect("item.vehicle_id", "vehicle_id")
      .addSelect("item.created_at", "added_at")
      .where("item.created_at <= :cutoff", { cutoff })
      .getRawMany<{
        profile_id: string;
        vehicle_id: string;
        added_at: Date;
      }>();

    return rows;
  }
}
