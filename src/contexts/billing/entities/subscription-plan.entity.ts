import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import {
  BILLING_TYPE,
  BillingType,
  PLAN_AUDIENCE,
  PLAN_TYPE,
  PlanAudience,
  PlanType,
} from "../types/billing.enums";
import { SubscriptionPlanPriceEntity } from "./subscription-plan-price.entity";
import { PlanFeatureEntity } from "./plan-feature.entity";
import { PlanVersionEntity } from "./plan-version.entity";

@Entity({ name: "subscription_plans" })
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", unique: true, nullable: true })
  slug!: string | null;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  /** @deprecated Capacidades van por entitlements; columna deprecada. */
  @Column({
    type: "enum",
    enum: PLAN_AUDIENCE,
    enumName: "subscription_plan_audience_enum",
    nullable: true,
  })
  audience!: PlanAudience | null;

  @Column({
    name: "billing_type",
    type: "enum",
    enum: BILLING_TYPE,
    enumName: "subscription_plan_billing_type_enum",
  })
  billing_type!: BillingType;

  @Column({
    type: "enum",
    enum: PLAN_TYPE,
    enumName: "subscription_plan_type_enum",
    default: PLAN_TYPE.STANDARD,
  })
  type!: PlanType;

  @Column({ name: "stripe_product_id", type: "varchar", nullable: true })
  stripe_product_id!: string | null;

  @Column({ name: "is_active", default: true })
  is_active!: boolean;

  @Column({ name: "is_featured", default: false })
  is_featured!: boolean;

  @Column({ name: "sort_order", default: 0 })
  sort_order!: number;

  @Column({ name: "effect_config", type: "jsonb", default: {} })
  effect_config!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @OneToMany(() => SubscriptionPlanPriceEntity, (price) => price.plan)
  prices!: Relation<SubscriptionPlanPriceEntity[]>;

  @OneToMany(() => PlanFeatureEntity, (feature) => feature.plan)
  features!: Relation<PlanFeatureEntity[]>;

  @OneToMany(() => PlanVersionEntity, (version) => version.plan)
  versions!: Relation<PlanVersionEntity[]>;
}
