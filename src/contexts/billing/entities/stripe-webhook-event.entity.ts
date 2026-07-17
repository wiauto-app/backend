import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({ name: "stripe_webhook_events" })
export class StripeWebhookEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", unique: true })
  event_id!: string;

  @Column({ name: "event_type" })
  event_type!: string;

  @CreateDateColumn({ name: "processed_at" })
  processed_at!: Date;
}
