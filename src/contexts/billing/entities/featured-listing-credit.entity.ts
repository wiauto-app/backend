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

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { FeaturedListingOfferEntity } from "./featured-listing-offer.entity";

@Entity({ name: "featured_listing_credits" })
export class FeaturedListingCreditEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  @Index("IDX_featured_listing_credits_profile_id")
  profile_id!: string;

  @Column({ name: "offer_id", type: "uuid", nullable: true })
  offer_id!: string | null;

  @Column({ name: "duration_days", type: "int" })
  duration_days!: number;

  @Column({ name: "boost_weight", type: "int", default: 50 })
  boost_weight!: number;

  @Column({
    name: "stripe_checkout_session_id",
    type: "varchar",
    nullable: true,
    unique: true,
  })
  stripe_checkout_session_id!: string | null;

  @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
  @Index("IDX_featured_listing_credits_consumed_at")
  consumed_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_featured_listing_credits_profile",
  })
  profile!: Relation<ProfileEntity>;

  @ManyToOne(() => FeaturedListingOfferEntity, {
    onDelete: "SET NULL",
    nullable: true,
  })
  @JoinColumn({
    name: "offer_id",
    foreignKeyConstraintName: "FK_featured_listing_credits_offer",
  })
  offer!: Relation<FeaturedListingOfferEntity | null>;
}
