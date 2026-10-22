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

@Entity({ name: "vehicle_drafts" })
export class VehicleDraftEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", unique: true })
  profile_id: string;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE", nullable: false })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_vehicle_drafts_profile_id",
  })
  profile: Relation<ProfileEntity>;

  @Column({ type: "jsonb" })
  values: Record<string, unknown>;

  @Column({ type: "int", nullable: true })
  step: number | null;

  @Column({ type: "uuid", nullable: true })
  appraisal_id: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date;
}
