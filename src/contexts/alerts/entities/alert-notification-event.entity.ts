import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import type { AlertEventType } from "../types/alert-event-type.enum";
import type { AlertNotificationChannel } from "../types/alert-notification-channel.enum";
import type { AlertNotificationEventStatus } from "../types/alert-notification-event-status.enum";
import type { PrimitiveAlertNotificationEvent } from "../types/alert-notification-event";
import { AlertEntity } from "./alert.entity";

@Entity({ name: "alert_notification_events" })
@Index("IDX_alert_notification_events_profile_id", ["profile_id"])
@Index("IDX_alert_notification_events_pending_digest", ["status", "scheduled_for"])
@Index("UQ_alert_notification_events_dedup", ["alert_id", "vehicle_id", "event_type"], {
  unique: true,
  where: `"alert_id" IS NOT NULL AND "vehicle_id" IS NOT NULL`,
})
export class AlertNotificationEventEntity implements PrimitiveAlertNotificationEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_alert_notification_events_profile_id",
  })
  profile: Relation<ProfileEntity>;

  @Column({ type: "uuid", nullable: true })
  alert_id: string | null;

  @ManyToOne(() => AlertEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({
    name: "alert_id",
    foreignKeyConstraintName: "FK_alert_notification_events_alert_id",
  })
  alert: Relation<AlertEntity> | null;

  @Column({ type: "uuid", nullable: true })
  vehicle_id: string | null;

  @Column({
    type: "enum",
    enum: [
      "new_listing",
      "price_drop",
      "sold_removed",
      "featured",
      "recently_updated",
      "favorite_change",
      "new_message",
      "seller_reply",
      "saved_vehicle_reminder",
    ],
    enumName: "alert_notification_event_type_enum",
  })
  event_type: AlertEventType;

  @Column({
    type: "enum",
    enum: ["email", "push", "sms"],
    enumName: "alert_notification_channel_enum",
  })
  channel: AlertNotificationChannel;

  @Column({
    type: "enum",
    enum: ["pending", "sent", "skipped"],
    enumName: "alert_notification_event_status_enum",
    default: "pending",
  })
  status: AlertNotificationEventStatus;

  @Column({ type: "timestamp", nullable: true })
  scheduled_for: Date | null;

  @Column({ type: "timestamp", nullable: true })
  sent_at: Date | null;

  @Column({ type: "jsonb", default: {} })
  payload: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;
}
