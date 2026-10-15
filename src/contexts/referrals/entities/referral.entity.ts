import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { FeaturedListingCreditEntity } from "@/src/contexts/billing/entities/featured-listing-credit.entity";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import type { ReferralStatus } from "../types/referral-status";

@Entity({ name: "referrals" })
export class ReferralEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "inviter_profile_id" })
  @Index("IDX_referrals_inviter_profile_id")
  inviter_profile_id!: string;

  @Column({ name: "invitee_profile_id" })
  @Index("IDX_referrals_invitee_profile_id", { unique: true })
  invitee_profile_id!: string;

  @Column({ type: "varchar" })
  status!: ReferralStatus;

  @Column({ name: "rewarded_credit_id", type: "uuid", nullable: true })
  rewarded_credit_id!: string | null;

  @Column({ name: "rewarded_at", type: "timestamptz", nullable: true })
  rewarded_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "inviter_profile_id",
    foreignKeyConstraintName: "FK_referrals_inviter_profile",
  })
  inviter_profile!: Relation<ProfileEntity>;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "invitee_profile_id",
    foreignKeyConstraintName: "FK_referrals_invitee_profile",
  })
  invitee_profile!: Relation<ProfileEntity>;

  @ManyToOne(() => FeaturedListingCreditEntity, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({
    name: "rewarded_credit_id",
    foreignKeyConstraintName: "FK_referrals_rewarded_credit",
  })
  rewarded_credit!: Relation<FeaturedListingCreditEntity | null>;
}
