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
  ONE_TIME_PRODUCT_KIND,
  ONE_TIME_PURCHASE_STATUS,
  OneTimeProductKind,
  OneTimePurchaseStatus,
} from "../types/billing.enums";
import { SubscriptionPlanEntity } from "./subscription-plan.entity";

@Entity({ name: "one_time_purchases" })
export class OneTimePurchaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  /** @deprecated Preferir product_kind + product_id */
  @Column({ name: "plan_id", nullable: true })
  plan_id!: string | null;

  @Column({
    name: "product_kind",
    type: "enum",
    enum: ONE_TIME_PRODUCT_KIND,
    enumName: "one_time_product_kind_enum",
    nullable: true,
  })
  product_kind!: OneTimeProductKind | null;

  @Column({ name: "product_id", type: "uuid", nullable: true })
  product_id!: string | null;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", nullable: true })
  stripe_payment_intent_id!: string | null;

  @Column({
    type: "enum",
    enum: ONE_TIME_PURCHASE_STATUS,
    enumName: "one_time_purchase_status_enum",
    default: ONE_TIME_PURCHASE_STATUS.PENDING,
  })
  status!: OneTimePurchaseStatus;

  @Column({ type: "jsonb", default: {} })
  metadata!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_one_time_purchases_profile",
  })
  profile!: Relation<ProfileEntity>;

  @ManyToOne(() => SubscriptionPlanEntity, {
    onDelete: "RESTRICT",
    nullable: true,
  })
  @JoinColumn({
    name: "plan_id",
    foreignKeyConstraintName: "FK_one_time_purchases_plan",
  })
  plan!: Relation<SubscriptionPlanEntity | null>;
}
