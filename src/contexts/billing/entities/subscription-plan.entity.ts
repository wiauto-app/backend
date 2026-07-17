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

import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import {
  BILLING_TYPE,
  BillingType,
  PLAN_AUDIENCE,
  PlanAudience,
} from "../types/billing.enums";
import { SubscriptionPlanPriceEntity } from "./subscription-plan-price.entity";
import { PlanFeatureEntity } from "./plan-feature.entity";

@Entity({ name: "subscription_plans" })
export class SubscriptionPlanEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  slug!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    type: "enum",
    enum: PLAN_AUDIENCE,
    enumName: "subscription_plan_audience_enum",
  })
  audience!: PlanAudience;

  @Column({
    name: "billing_type",
    type: "enum",
    enum: BILLING_TYPE,
    enumName: "subscription_plan_billing_type_enum",
  })
  billing_type!: BillingType;

  @Column({ name: "role_id", nullable: true })
  role_id!: string | null;

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

  @ManyToOne(() => Roles, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "role_id",
    foreignKeyConstraintName: "FK_subscription_plans_role",
  })
  role!: Relation<Roles | null>;

  @OneToMany(() => SubscriptionPlanPriceEntity, (price) => price.plan)
  prices!: Relation<SubscriptionPlanPriceEntity[]>;

  @OneToMany(() => PlanFeatureEntity, (feature) => feature.plan)
  features!: Relation<PlanFeatureEntity[]>;
}
