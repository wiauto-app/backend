import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

import {
  STRIPE_WEBHOOK_EVENT_STATUS,
  StripeWebhookEventStatus,
} from "../types/billing.enums";

/**
 * Processing ledger for Stripe webhook events. A row is only `processed` once
 * its handler finished successfully; `processing` rows are an in-flight claim
 * (reclaimable after a stale threshold) and `failed` rows are retried when
 * Stripe redelivers the event.
 */
@Entity({ name: "stripe_webhook_events" })
export class StripeWebhookEventEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "event_id", unique: true })
  event_id!: string;

  @Column({ name: "event_type" })
  event_type!: string;

  @Column({
    type: "enum",
    enum: STRIPE_WEBHOOK_EVENT_STATUS,
    enumName: "stripe_webhook_event_status_enum",
    default: STRIPE_WEBHOOK_EVENT_STATUS.PROCESSING,
  })
  status!: StripeWebhookEventStatus;

  @Column({ type: "int", default: 1 })
  attempts!: number;

  @Column({ name: "last_error", type: "text", nullable: true })
  last_error!: string | null;

  /** Last time a worker claimed the event; drives stale-claim recovery. */
  @Column({ name: "claimed_at", type: "timestamp", default: () => "now()" })
  claimed_at!: Date;

  /** Set only when the handler completed successfully. */
  @Column({ name: "processed_at", type: "timestamp", nullable: true })
  processed_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}
