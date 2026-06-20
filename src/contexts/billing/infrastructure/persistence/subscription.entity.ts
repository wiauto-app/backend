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

import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";
import {
  SUBSCRIPTION_STATUS,
  SubscriptionStatus,
} from "../../domain/enums/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "subscriptions" })
export class SubscriptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ name: "stripe_customer_id" })
  stripe_customer_id!: string;

  @Column({ name: "stripe_subscription_id", unique: true })
  stripe_subscription_id!: string;

  @Column({ type: "enum", enum: SUBSCRIPTION_STATUS, default: SUBSCRIPTION_STATUS.INCOMPLETE })
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
  @JoinColumn({ name: "profile_id" })
  profile!: Relation<ProfileEntity>;

  @ManyToOne(() => SubscriptionPlanEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "plan_id" })
  plan!: Relation<SubscriptionPlanEntity>;
}
