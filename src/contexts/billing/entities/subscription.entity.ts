import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
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
import { PlanVersionEntity } from "./plan-version.entity";
import { SubscriptionEntitlementOverrideEntity } from "./subscription-entitlement-override.entity";
import { SubscriptionUsageEntity } from "./subscription-usage.entity";

@Entity({ name: "subscriptions" })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ name: "plan_version_id", nullable: true })
  plan_version_id!: string | null;

  @Column({ name: "stripe_customer_id" })
  stripe_customer_id!: string;

  @Column({ name: "stripe_subscription_id", unique: true })
  stripe_subscription_id!: string;

  @Column({ name: "stripe_price_id", type: "varchar", nullable: true })
  stripe_price_id!: string | null;

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

  @ManyToOne(() => PlanVersionEntity, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({
    name: "plan_version_id",
    foreignKeyConstraintName: "FK_subscriptions_plan_version",
  })
  plan_version!: Relation<PlanVersionEntity | null>;

  @OneToMany(
    () => SubscriptionEntitlementOverrideEntity,
    (override) => override.subscription,
  )
  overrides!: Relation<SubscriptionEntitlementOverrideEntity[]>;

  @OneToMany(() => SubscriptionUsageEntity, (usage) => usage.subscription)
  usage!: Relation<SubscriptionUsageEntity[]>;
}
