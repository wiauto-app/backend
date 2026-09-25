import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import type { ProactiveAlertType } from "../constants/proactive-alert-types";

@Entity({ name: "proactive_alert_log" })
@Unique("UQ_proactive_alert_log_dedupe", ["dedupe_key"])
@Index("IDX_proactive_alert_log_profile_type", ["profile_id", "type"])
export class ProactiveAlertLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @Column({ type: "uuid", nullable: true })
  vehicle_id: string | null;

  @Column({ type: "varchar", length: 64 })
  type: ProactiveAlertType;

  @Column({ type: "varchar", length: 256 })
  dedupe_key: string;

  @CreateDateColumn({ type: "timestamptz" })
  sent_at: Date;
}
