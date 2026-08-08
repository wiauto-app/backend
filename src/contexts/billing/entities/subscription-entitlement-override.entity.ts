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
import { SubscriptionEntity } from "./subscription.entity";

@Entity({ name: "subscription_entitlement_overrides" })
@Unique("UQ_subscription_entitlement_overrides_sub_feature", [
  "subscription_id",
  "feature",
])
export class SubscriptionEntitlementOverrideEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "subscription_id" })
  subscription_id!: string;

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

  @ManyToOne(() => SubscriptionEntity, (subscription) => subscription.overrides, {
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "subscription_id",
    foreignKeyConstraintName: "FK_subscription_entitlement_overrides_subscription",
  })
  subscription!: Relation<SubscriptionEntity>;
}
