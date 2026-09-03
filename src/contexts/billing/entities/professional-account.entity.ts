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
  PROFESSIONAL_ACCOUNT_TYPE,
  ProfessionalAccountType,
} from "../types/billing.enums";

@Entity({ name: "professional_accounts" })
export class ProfessionalAccountEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id", type: "uuid", unique: true })
  profile_id!: string;

  @Column({
    type: "enum",
    enum: PROFESSIONAL_ACCOUNT_TYPE,
    enumName: "professional_account_type_enum",
  })
  type!: ProfessionalAccountType;

  @Column({ name: "legal_name", type: "varchar" })
  legal_name!: string;

  @Column({ name: "commercial_name", type: "varchar", nullable: true })
  commercial_name!: string | null;

  @Column({ name: "tax_id", type: "varchar" })
  tax_id!: string;

  @Column({ name: "email", type: "varchar", nullable: true })
  email!: string | null;

  @Column({ name: "phone_code", type: "varchar", nullable: true })
  phone_code!: string | null;

  @Column({ name: "phone", type: "varchar", nullable: true })
  phone!: string | null;

  @Column({ name: "stripe_customer_id", type: "varchar", nullable: true })
  stripe_customer_id!: string | null;

  @Column({ name: "accepted_terms_at", type: "timestamptz" })
  accepted_terms_at!: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_professional_accounts_profile",
  })
  profile!: Relation<ProfileEntity>;
}
