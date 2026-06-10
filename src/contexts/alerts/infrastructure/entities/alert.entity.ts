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

import type { AlertFilters } from "../../domain/filters/alert-filters";
import type { PrimitiveAlert } from "../../domain/entities/alert";

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
}
