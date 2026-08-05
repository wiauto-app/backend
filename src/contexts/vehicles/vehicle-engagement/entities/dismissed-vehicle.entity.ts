import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  Unique,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { VehicleEntity } from "../../entities/vehicle.entity";

@Entity({ name: "dismissed_vehicles" })
@Unique("UQ_dismissed_vehicles_profile_vehicle", ["profile_id", "vehicle_id"])
export class DismissedVehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  profile_id: string;

  @Column({ type: "uuid" })
  vehicle_id: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_dismissed_vehicles_profile_id",
  })
  profile: Relation<ProfileEntity>;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "vehicle_id",
    foreignKeyConstraintName: "FK_dismissed_vehicles_vehicle_id",
  })
  vehicle: Relation<VehicleEntity>;
}
