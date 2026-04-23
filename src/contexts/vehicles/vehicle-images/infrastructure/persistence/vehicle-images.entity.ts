import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from "typeorm";
import { VehicleEntity } from "../../../infrastructure/persistence/vehicle.entity";

@Entity({ name: "vehicle_images" })
export class VehicleImagesEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @ManyToOne(() => VehicleEntity, (vehicle) => vehicle.images, { onDelete: "CASCADE" })
  @JoinColumn({ name: "vehicle_id" })
  vehicle: VehicleEntity;

  /** Misma columna que la FK; solo lectura para mapeo a dominio / saves por id. */
  @RelationId((vehicle_image: VehicleImagesEntity) => vehicle_image.vehicle)
  vehicle_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}