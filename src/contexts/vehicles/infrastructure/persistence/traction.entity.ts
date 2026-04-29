import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveTraction } from "../../domain/entities/traction";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "tractions" })
export class TractionEntity implements PrimitiveTraction {
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

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.traction)
  vehicles: Relation<VehicleEntity[]>;
}
