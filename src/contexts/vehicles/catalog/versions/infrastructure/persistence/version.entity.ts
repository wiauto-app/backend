import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { VehicleEntity } from "../../../../infrastructure/persistence/vehicle.entity";

@Entity({ name: "version" })
export class VersionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make_id: number;

  @Column()
  model_id: number;

  @Column()
  body_type_id: number;

  @Column()
  fuel_type_id: number;

  @Column()
  year_id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.version)
  vehicles: Relation<VehicleEntity[]>;
}
