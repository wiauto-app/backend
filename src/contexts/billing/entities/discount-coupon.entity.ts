import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "discount_coupons" })
export class DiscountCouponEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({
    name: "percent_off",
    type: "numeric",
    precision: 5,
    scale: 2,
    nullable: true,
  })
  percent_off!: number | null;

  @Column({ name: "amount_off_cents", type: "int", nullable: true })
  amount_off_cents!: number | null;

  @Column({ type: "varchar", length: 3, nullable: true })
  currency!: string | null;

  @Column({ name: "stripe_coupon_id", unique: true })
  stripe_coupon_id!: string;

  @Column({ name: "stripe_promotion_code_id", unique: true })
  stripe_promotion_code_id!: string;

  @Column({ name: "max_redemptions", type: "int", default: 1 })
  max_redemptions!: number;

  @Column({ name: "times_redeemed", type: "int", default: 0 })
  times_redeemed!: number;

  @Column({ default: true })
  active!: boolean;

  @Column({ name: "expires_at", type: "timestamptz", nullable: true })
  expires_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
