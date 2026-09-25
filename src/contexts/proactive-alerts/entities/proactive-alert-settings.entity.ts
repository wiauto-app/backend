import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn, Relation } from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { PROACTIVE_ALERT_TYPES } from "../constants/proactive-alert-types";
import type { ProactiveAlertType } from "../constants/proactive-alert-types";

const default_enabled_types = (): ProactiveAlertType[] =>
  PROACTIVE_ALERT_TYPES.map((item) => item.type);

@Entity({ name: "proactive_alert_settings" })
export class ProactiveAlertSettingsEntity {
  @PrimaryColumn({ type: "uuid" })
  profile_id: string;

  @Column({ type: "jsonb", default: () => "'[]'" })
  enabled_types: ProactiveAlertType[];

  @OneToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  static defaultEnabledTypes(): ProactiveAlertType[] {
    return default_enabled_types();
  }
}
