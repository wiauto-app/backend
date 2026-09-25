import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

export const LEAD_ASSISTANT_REPLY_DELAY_SECONDS = [0, 30, 60, 120, 300] as const;

export type LeadAssistantReplyDelaySeconds =
  (typeof LEAD_ASSISTANT_REPLY_DELAY_SECONDS)[number];

@Entity({ name: "lead_assistant_settings" })
export class LeadAssistantSettingsEntity {
  @PrimaryColumn({ name: "profile_id", type: "uuid" })
  profile_id!: string;

  @OneToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile!: Relation<ProfileEntity>;

  @Column({ type: "boolean", default: false })
  enabled!: boolean;

  @Column({ name: "context_note", type: "varchar", length: 500, default: "" })
  context_note!: string;

  @Column({ type: "varchar", length: 32, default: "anyone" })
  objective!: string;

  @Column({ type: "varchar", length: 32, default: "balanced" })
  persuasion!: string;

  @Column({ type: "varchar", length: 32, default: "medium" })
  extension!: string;

  @Column({ type: "varchar", length: 32, default: "professional" })
  tone!: string;

  @Column({ name: "reply_delay_seconds", type: "int", default: 30 })
  reply_delay_seconds!: number;

  @Column({ name: "notify_on_reply", type: "boolean", default: true })
  notify_on_reply!: boolean;

  @Column({ name: "notify_on_quota_exhausted", type: "boolean", default: true })
  notify_on_quota_exhausted!: boolean;

  @Column({ name: "notify_on_hot_lead", type: "boolean", default: true })
  notify_on_hot_lead!: boolean;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
