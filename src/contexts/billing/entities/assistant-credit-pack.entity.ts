import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "assistant_credit_packs" })
export class AssistantCreditPackEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "credits_quantity", type: "int" })
  credits_quantity!: number;

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
