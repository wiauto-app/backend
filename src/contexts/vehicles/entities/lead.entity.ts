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
import { LEAD_TYPE, LeadType, PrimitiveLead } from "../types/lead";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "leads" })
export class LeadEntity implements PrimitiveLead {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({
    type: "enum",
    enum: LEAD_TYPE,
    enumName: "lead_type",
    default: LEAD_TYPE.CONTACT,
  })
  type: LeadType;

  @Column()
  name: string;

  @Column({ type: "varchar", nullable: true })
  email: string | null;

  
  @Column({ type: "varchar", nullable: true })
  phone: string | null;

  @Column({ type: "varchar", nullable: true })
  phone_code: string | null;

  @Column({ type: "varchar", nullable: true })
  message: string | null;

  @Column({ type: "date", nullable: true })
  callback_scheduled_at: Date | null;

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
