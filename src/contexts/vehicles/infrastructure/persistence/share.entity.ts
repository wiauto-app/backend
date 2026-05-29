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

import { PrimitiveShare } from "../../domain/entities/share";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_shares" })
export class ShareEntity implements PrimitiveShare {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @Column({ type: "varchar" })
  platform: string;

  @Column({ type: "varchar" })
  source: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity | null>;
}
