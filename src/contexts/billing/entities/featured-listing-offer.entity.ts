import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "featured_listing_offers" })
export class FeaturedListingOfferEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "duration_days", type: "int" })
  duration_days!: number;

  @Column({ name: "boost_weight", type: "int", default: 50 })
  boost_weight!: number;

  @Column({ name: "amount_cents", type: "int" })
  amount_cents!: number;

  @Column({ type: "varchar", length: 3, default: "eur" })
  currency!: string;

  @Column({ name: "stripe_product_id", type: "varchar", nullable: true })
  stripe_product_id!: string | null;

  @Column({ name: "stripe_price_id", type: "varchar", nullable: true })
  stripe_price_id!: string | null;

  @Column({ name: "is_active", default: true })
  is_active!: boolean;

  @Column({ name: "sort_order", default: 0 })
  sort_order!: number;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
