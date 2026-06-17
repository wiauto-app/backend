import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";

import type { AlertNotificationFrequency } from "../../domain/enums/alert-notification-frequency.enum";
import type { PrimitiveAlertNotificationPreferences } from "../../domain/entities/alert-notification-preferences";

@Entity({ name: "alert_notification_preferences" })
export class AlertNotificationPreferencesEntity
  implements PrimitiveAlertNotificationPreferences
{
  @PrimaryColumn({ type: "uuid" })
  profile_id: string;

  @OneToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @Column({ default: true })
  notify_new_matches: boolean;

  @Column({ default: true })
  notify_price_drops: boolean;

  @Column({ default: true })
  notify_favorite_changes: boolean;

  @Column({ default: true })
  notify_new_messages: boolean;

  @Column({ default: true })
  notify_seller_replies: boolean;

  @Column({ default: true })
  notify_saved_vehicle_reminders: boolean;

  @Column({ default: 7 })
  saved_vehicle_reminder_days: number;

  @Column({
    type: "enum",
    enum: ["instant", "daily", "weekly"],
    default: "instant",
  })
  frequency: AlertNotificationFrequency;

  @Column({ default: true })
  channel_email: boolean;

  @Column({ default: true })
  channel_push: boolean;

  @Column({ default: false })
  channel_sms: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
