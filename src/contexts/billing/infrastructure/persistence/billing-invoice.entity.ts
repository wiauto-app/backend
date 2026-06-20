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
  BILLING_INVOICE_STATUS,
  BillingInvoiceStatus,
} from "../../domain/enums/billing.enums";

@Entity({ name: "billing_invoices" })
export class BillingInvoiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id" })
  profile_id!: string;

  @Column({ name: "stripe_invoice_id", unique: true })
  stripe_invoice_id!: string;

  @Column({ name: "amount_paid_cents", default: 0 })
  amount_paid_cents!: number;

  @Column({ default: "eur" })
  currency!: string;

  @Column({ type: "enum", enum: BILLING_INVOICE_STATUS, default: BILLING_INVOICE_STATUS.DRAFT })
  status!: BillingInvoiceStatus;

  @Column({ name: "invoice_pdf_url", type: "varchar", nullable: true })
  invoice_pdf_url!: string | null;

  @Column({ name: "hosted_invoice_url", type: "varchar", nullable: true })
  hosted_invoice_url!: string | null;

  @Column({ name: "paid_at", type: "timestamp", nullable: true })
  paid_at!: Date | null;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile!: Relation<ProfileEntity>;
}
