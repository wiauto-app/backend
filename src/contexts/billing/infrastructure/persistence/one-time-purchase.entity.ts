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
  ONE_TIME_PURCHASE_STATUS,
  OneTimePurchaseStatus,
} from "../../domain/enums/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "one_time_purchases" })
export class OneTimePurchaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "plan_id" })
  plan_id!: string;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", nullable: true })
  stripe_payment_intent_id!: string | null;

  @Column({ type: "enum", enum: ONE_TIME_PURCHASE_STATUS, default: ONE_TIME_PURCHASE_STATUS.PENDING })
  status!: OneTimePurchaseStatus;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

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
