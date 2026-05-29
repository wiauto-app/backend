import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/infrastructure/persistence/profile.entity";

import { PrimitiveView } from "../../domain/entities/view";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_views" })
export class ViewEntity implements PrimitiveView {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @Column({ type: "varchar", nullable: true })
  ip_hash: string | null;

  @Column({ type: "varchar", nullable: true })
  user_agent: string | null;

  @Column({ type: "varchar", nullable: true })
  referer: string | null;

  @Column({ type: "jsonb", default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity | null>;
}
