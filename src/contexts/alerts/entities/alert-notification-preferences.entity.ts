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

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import type { AlertNotificationFrequency } from "../types/alert-notification-frequency.enum";
import type { PrimitiveAlertNotificationPreferences } from "../types/alert-notification-preferences";

@Entity({ name: "alert_notification_preferences" })
export class AlertNotificationPreferencesEntity
  implements PrimitiveAlertNotificationPreferences
{
  @PrimaryColumn({ type: "uuid" })
  profile_id: string;

  @OneToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_alert_notification_preferences_profile_id",
  })
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

  @Column({ default: true })
  notify_new_leads: boolean;

  @Column({ default: 7 })
  saved_vehicle_reminder_days: number;

  @Column({
    type: "enum",
    enum: ["instant", "daily", "weekly"],
    enumName: "alert_notification_frequency_enum",
    default: "instant",
  })
  frequency: AlertNotificationFrequency;

  @Column({ default: true })
  channel_email: boolean;

  @Column({ default: true })
  channel_push: boolean;

  @Column({ default: false })
  channel_sms: boolean;

  @Column({ default: true })
  channel_in_app: boolean;

  @Column({ default: false })
  channel_whatsapp: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
