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

import { SubscriptionEntity } from "./subscription.entity";

@Entity({ name: "subscription_usage" })
@Unique("UQ_subscription_usage_sub_feature_period", [
  "subscription_id",
  "feature",
  "period_start",
])
export class SubscriptionUsageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "subscription_id" })
  subscription_id!: string;

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

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.usage, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "subscription_id",
    foreignKeyConstraintName: "FK_subscription_usage_subscription",
  })
  subscription!: Relation<SubscriptionEntity>;
}
