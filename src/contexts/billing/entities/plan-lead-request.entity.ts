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
  PLAN_LEAD_STATUS,
  PRICE_INTERVAL,
  PlanLeadStatus,
  PriceInterval,
} from "../types/billing.enums";
import { EntitlementValue, EntitlementValueType } from "../types/entitlement-features";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

export interface ProposedEntitlementOverride {
  feature: string;
  value_type: EntitlementValueType;
  value: EntitlementValue;
}

@Entity({ name: "plan_lead_requests" })
export class PlanLeadRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone!: string;

  @Column()
  cars_quantity!: string;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({ name: "profile_id", type: "uuid", nullable: true })
  profile_id!: string | null;

  @Column({
    type: "enum",
    enum: PLAN_LEAD_STATUS,
    enumName: "plan_lead_status_enum",
    default: PLAN_LEAD_STATUS.PENDING,
  })
  status!: PlanLeadStatus;

  @Column({ name: "base_plan_id", type: "uuid", nullable: true })
  base_plan_id!: string | null;

  @Column({ name: "proposed_price_cents", type: "int", nullable: true })
  proposed_price_cents!: number | null;

  @Column({
    name: "proposed_interval",
    type: "enum",
    enum: PRICE_INTERVAL,
    enumName: "subscription_plan_price_interval_enum",
    nullable: true,
  })
  proposed_interval!: PriceInterval | null;

  @Column({ name: "proposed_stripe_price_id", type: "varchar", nullable: true })
  proposed_stripe_price_id!: string | null;

  @Column({ name: "proposal_notes", type: "text", nullable: true })
  proposal_notes!: string | null;

  @Column({ name: "proposed_overrides", type: "jsonb", nullable: true })
  proposed_overrides!: ProposedEntitlementOverride[] | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_plan_lead_requests_profile",
  })
  profile!: Relation<ProfileEntity | null>;

  @ManyToOne(() => SubscriptionPlanEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "base_plan_id",
    foreignKeyConstraintName: "FK_plan_lead_requests_base_plan",
  })
  base_plan!: Relation<SubscriptionPlanEntity | null>;
}
