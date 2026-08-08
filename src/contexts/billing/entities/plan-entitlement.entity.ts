import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import {
  ENTITLEMENT_VALUE_TYPE,
  EntitlementValue,
  EntitlementValueType,
} from "../types/entitlement-features";
import { PlanVersionEntity } from "./plan-version.entity";

@Entity({ name: "plan_entitlements" })
@Unique("UQ_plan_entitlements_version_feature", ["plan_version_id", "feature"])
export class PlanEntitlementEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "plan_version_id" })
  plan_version_id!: string;

  @Column({ type: "varchar" })
  feature!: string;

  @Column({
    name: "value_type",
    type: "enum",
    enum: ENTITLEMENT_VALUE_TYPE,
    enumName: "entitlement_value_type_enum",
  })
  value_type!: EntitlementValueType;

  @Column({ type: "jsonb" })
  value!: EntitlementValue;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => PlanVersionEntity, (version) => version.entitlements, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "plan_version_id",
    foreignKeyConstraintName: "FK_plan_entitlements_plan_version",
  })
  plan_version!: Relation<PlanVersionEntity>;
}
