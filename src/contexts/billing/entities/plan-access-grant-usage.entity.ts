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

import { PlanAccessGrantEntity } from "./plan-access-grant.entity";

@Entity({ name: "plan_access_grant_usage" })
@Unique("UQ_plan_access_grant_usage_feature_period", [
  "grant_id",
  "feature",
  "period_start",
])
export class PlanAccessGrantUsageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "grant_id" })
  grant_id!: string;

  @Column({ type: "varchar" })
  feature!: string;

  @Column({ name: "period_start", type: "timestamp" })
  period_start!: Date;

  @Column({ name: "period_end", type: "timestamp" })
  period_end!: Date;

  @Column({ type: "int", default: 0 })
  used!: number;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => PlanAccessGrantEntity, (grant) => grant.usage, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "grant_id",
    foreignKeyConstraintName: "FK_plan_access_grant_usage_grant",
  })
  grant!: Relation<PlanAccessGrantEntity>;
}
