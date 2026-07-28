import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";

import { PrimitiveImpression } from "../types/impression";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "vehicle_impressions" })
@Index("IDX_vehicle_impressions_vehicle_id", ["vehicle_id"])
@Index("IDX_vehicle_impressions_created_at", ["created_at"])
export class ImpressionEntity implements PrimitiveImpression {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  vehicle_id: string;

  @Column({ type: "uuid", nullable: true })
  profile_id: string | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE" })
  @JoinColumn({
    name: "vehicle_id",
    foreignKeyConstraintName: "FK_vehicle_impressions_vehicle_id",
  })
  vehicle: Relation<VehicleEntity>;

  @ManyToOne(() => ProfileEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({
    name: "profile_id",
    foreignKeyConstraintName: "FK_vehicle_impressions_profile_id",
  })
  profile: Relation<ProfileEntity | null>;
}
