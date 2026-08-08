import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import {
  PLAN_VERSION_STATUS,
  PlanVersionStatus,
} from "../types/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";
import { PlanEntitlementEntity } from "./plan-entitlement.entity";

@Entity({ name: "plan_versions" })
@Unique("UQ_plan_versions_plan_version", ["plan_id", "version"])
export class PlanVersionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ type: "int" })
  version!: number;

  @Column({
    type: "enum",
    enum: PLAN_VERSION_STATUS,
    enumName: "plan_version_status_enum",
    default: PLAN_VERSION_STATUS.DRAFT,
  })
  status!: PlanVersionStatus;

  @Column({ name: "published_at", type: "timestamp", nullable: true })
  published_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.versions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "plan_id",
    foreignKeyConstraintName: "FK_plan_versions_plan",
  })
  plan!: Relation<SubscriptionPlanEntity>;

  @OneToMany(() => PlanEntitlementEntity, (entitlement) => entitlement.plan_version)
  entitlements!: Relation<PlanEntitlementEntity[]>;
}
