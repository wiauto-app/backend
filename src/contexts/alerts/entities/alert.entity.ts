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

import type { AlertFilters } from "../types/alert-filters";
import type { PrimitiveAlert } from "../types/alert";

@Entity({ name: "alerts" })
export class AlertEntity implements PrimitiveAlert {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "uuid" })
  profile_id: string;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  phone_code: string;

  @Column({ type: "jsonb" })
  filters: AlertFilters;

  @Column({ type: "timestamp", nullable: true })
  last_sent_at: Date | null;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  notify_new_listings: boolean;

  @Column({ default: true })
  notify_price_drops: boolean;

  @Column({ default: false })
  notify_sold_removed: boolean;

  @Column({ default: false })
  notify_featured: boolean;

  @Column({ default: false })
  notify_recently_updated: boolean;

  @Column({ type: "timestamp", nullable: true })
  last_viewed_at: Date | null;
}
