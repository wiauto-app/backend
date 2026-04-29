import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveService } from "../../domain/entities/services";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "services" })
export class ServiceEntity implements PrimitiveService {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ type: "text" })
  description: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => VehicleEntity, (vehicle) => vehicle.services)
  vehicles: Relation<VehicleEntity[]>;
}
