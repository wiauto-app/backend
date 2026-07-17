import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PrimitiveVehicleType } from "../types/vehicle-types";

@Entity({ name: "vehicle_types" })
export class VehicleTypeEntity implements PrimitiveVehicleType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ type: "varchar", nullable: true })
  image_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}