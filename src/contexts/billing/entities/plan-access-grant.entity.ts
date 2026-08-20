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
import { User } from "@/src/contexts/users/entities/user.entity";
import { PlanVersionEntity } from "./plan-version.entity";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";
import { PlanAccessGrantUsageEntity } from "./plan-access-grant-usage.entity";

@Entity({ name: "plan_access_grants" })
export class PlanAccessGrantEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ name: "plan_version_id" })
  plan_version_id!: string;

  @Column({ name: "granted_by_user_id" })
  granted_by_user_id!: string;

  @Column({ name: "revoked_by_user_id", nullable: true })
  revoked_by_user_id!: string | null;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expires_at!: Date | null;

  @Column({ name: "revoked_at", type: "timestamp", nullable: true })
  revoked_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_plan_access_grants_profile",
  })
  profile!: Relation<ProfileEntity>;

  @ManyToOne(() => SubscriptionPlanEntity, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "plan_id",
    foreignKeyConstraintName: "FK_plan_access_grants_plan",
  })
  plan!: Relation<SubscriptionPlanEntity>;

  @ManyToOne(() => PlanVersionEntity, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "plan_version_id",
    foreignKeyConstraintName: "FK_plan_access_grants_plan_version",
  })
  plan_version!: Relation<PlanVersionEntity>;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "granted_by_user_id",
    foreignKeyConstraintName: "FK_plan_access_grants_granted_by",
  })
  granted_by!: Relation<User>;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "revoked_by_user_id",
    foreignKeyConstraintName: "FK_plan_access_grants_revoked_by",
  })
  revoked_by!: Relation<User | null>;

  @OneToMany(() => PlanAccessGrantUsageEntity, (usage) => usage.grant)
  usage!: Relation<PlanAccessGrantUsageEntity[]>;
}
