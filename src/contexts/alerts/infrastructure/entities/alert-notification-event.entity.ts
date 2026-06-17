import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import type { AlertEventType } from "../../domain/enums/alert-event-type.enum";
import type { AlertNotificationChannel } from "../../domain/enums/alert-notification-channel.enum";
import type { AlertNotificationEventStatus } from "../../domain/enums/alert-notification-event-status.enum";
import type { PrimitiveAlertNotificationEvent } from "../../domain/entities/alert-notification-event";
import { AlertEntity } from "./alert.entity";

@Entity({ name: "alert_notification_events" })
export class AlertNotificationEventEntity implements PrimitiveAlertNotificationEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @Column({ type: "uuid", nullable: true })
  alert_id: string | null;

  @ManyToOne(() => AlertEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "alert_id" })
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
  })
  event_type: AlertEventType;

  @Column({
    type: "enum",
    enum: ["email", "push", "sms"],
  })
  channel: AlertNotificationChannel;

  @Column({
    type: "enum",
    enum: ["pending", "sent", "skipped"],
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
