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

import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "plan_features" })
export class PlanFeatureEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column()
  label!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ default: true })
  included!: boolean;

  @Column({ name: "sort_order", default: 0 })
  sort_order!: number;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => SubscriptionPlanEntity, (plan) => plan.features, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "plan_id" })
  plan!: Relation<SubscriptionPlanEntity>;
}
