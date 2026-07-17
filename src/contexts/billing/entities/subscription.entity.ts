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

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import {
  SUBSCRIPTION_STATUS,
  SubscriptionStatus,
} from "../types/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "subscriptions" })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ name: "stripe_customer_id" })
  stripe_customer_id!: string;

  @Column({ name: "stripe_subscription_id", unique: true })
  stripe_subscription_id!: string;

  @Column({
    type: "enum",
    enum: SUBSCRIPTION_STATUS,
    enumName: "subscription_status_enum",
    default: SUBSCRIPTION_STATUS.INCOMPLETE,
  })
  status!: SubscriptionStatus;

  @Column({ name: "current_period_start", type: "timestamp", nullable: true })
  current_period_start!: Date | null;

  @Column({ name: "current_period_end", type: "timestamp", nullable: true })
  current_period_end!: Date | null;

  @Column({ name: "cancel_at_period_end", default: false })
  cancel_at_period_end!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_subscriptions_profile",
  })
  profile!: Relation<ProfileEntity>;

  @ManyToOne(() => SubscriptionPlanEntity, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "plan_id",
    foreignKeyConstraintName: "FK_subscriptions_plan",
  })
  plan!: Relation<SubscriptionPlanEntity>;
}
