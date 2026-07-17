import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import {
  PRICE_INTERVAL,
  PriceInterval,
} from "../types/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "subscription_plan_prices" })
export class SubscriptionPlanPriceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({
    type: "enum",
    enum: PRICE_INTERVAL,
    enumName: "subscription_plan_price_interval_enum",
  })
  interval!: PriceInterval;

  @Column({ name: "amount_cents" })
  amount_cents!: number;

  @Column({ default: "eur" })
  currency!: string;

  @Column({ name: "stripe_price_id", type: "varchar", nullable: true })
  stripe_price_id!: string | null;

  @Column({ name: "is_active", default: true })
  is_active!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.prices, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "plan_id",
    foreignKeyConstraintName: "FK_subscription_plan_prices_plan",
  })
  plan!: Relation<SubscriptionPlanEntity>;
}
