import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

@Entity({ name: "lead_assistant_quota_notices" })
@Unique("UQ_lead_assistant_quota_notice_period", [
  "profile_id",
  "chat_id",
  "period_start",
])
export class LeadAssistantQuotaNoticeEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "profile_id", type: "uuid" })
  profile_id!: string;

  @Column({ name: "chat_id", type: "uuid" })
  chat_id!: string;

  @Column({ name: "period_start", type: "timestamptz" })
  period_start!: Date;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;
}
