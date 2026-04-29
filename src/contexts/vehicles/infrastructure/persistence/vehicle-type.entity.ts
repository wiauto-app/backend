import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { PrimitiveVehicleType } from "../../domain/entities/vehicle-types";

@Entity({ name: "vehicle_types" })
export class VehicleTypeEntity implements PrimitiveVehicleType {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}