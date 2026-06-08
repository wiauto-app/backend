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
import { PrimitiveLead } from "../../domain/entities/lead";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "leads" })
export class LeadEntity implements PrimitiveLead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", nullable: true })
  phone_code: string | null;

  @Column()
  message: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;
}
