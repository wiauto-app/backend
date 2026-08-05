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

@Entity({ name: "vehicle_price_watches" })
@Unique("UQ_vehicle_price_watches_profile_vehicle", [
  "profile_id",
  "vehicle_id",
])
export class VehiclePriceWatchEntity {
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
    foreignKeyConstraintName: "FK_vehicle_price_watches_profile_id",
  })
  profile: Relation<ProfileEntity>;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "vehicle_id",
    foreignKeyConstraintName: "FK_vehicle_price_watches_vehicle_id",
  })
  vehicle: Relation<VehicleEntity>;
}
