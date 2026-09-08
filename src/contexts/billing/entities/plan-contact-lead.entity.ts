import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import {
  PLAN_CONTACT_LEAD_SOURCE,
  PLAN_CONTACT_LEAD_STATUS,
  PlanContactLeadStatus,
} from "../types/billing.enums";

@Entity({ name: "plan_contact_leads" })
export class PlanContactLeadEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  phone!: string;

  @Column({ default: PLAN_CONTACT_LEAD_SOURCE.PLANES })
  source!: string;

  @Column({
    type: "enum",
    enum: PLAN_CONTACT_LEAD_STATUS,
    enumName: "plan_contact_lead_status_enum",
    default: PLAN_CONTACT_LEAD_STATUS.PENDING,
  })
  status!: PlanContactLeadStatus;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
