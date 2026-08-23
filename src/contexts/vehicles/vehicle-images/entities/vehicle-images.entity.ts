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
import { VehicleEntity } from "../../entities/vehicle.entity";

export type VehicleImageStatus = "uploaded" | "processing" | "ready" | "failed";

@Entity({ name: "vehicle_images" })
export class VehicleImagesEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", nullable: true })
  url: string | null;

  @Column({ type: "integer" })
  order: number;

  @Column({
    type: "enum",
    enum: ["uploaded", "processing", "ready", "failed"],
    default: "uploaded",
  })
  status: VehicleImageStatus;

  @Column({ type: "varchar", nullable: true })
  source_path: string | null;

  @Column({ nullable: true, type: "text" })
  failure_reason: string | null;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: Relation<VehicleEntity>;

  @Column({ type: "uuid" })
  vehicle_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}