import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { VehicleEntity } from "../../../../infrastructure/persistence/vehicle.entity";
import { MakeEntity } from "../../../makes/infrastructure/persistence/make.entity";
import { CatalogModelEntity } from "../../../models/infrastructure/persistence/catalog-model.entity";
import { CatalogBodyTypeEntity } from "../../../body_types/infrastructure/persistence/catalog-body-type.entity";
import { CatalogFuelTypeEntity } from "../../../fuel_types/infrastructure/persistence/catalog-fuel-type.entity";
import { CatalogYearEntity } from "../../../years/infrastructure/persistence/catalog-year.entity";

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

  @ManyToOne(() => MakeEntity, (make) => make.versions)
  @JoinColumn({ name: "make_id" })
  make: Relation<MakeEntity>;

  @ManyToOne(() => CatalogModelEntity, (model) => model.versions)
  @JoinColumn({ name: "model_id" })
  model: Relation<CatalogModelEntity>;

  @ManyToOne(() => CatalogBodyTypeEntity, (body_type) => body_type.versions)
  @JoinColumn({ name: "body_type_id" })
  body_type: Relation<CatalogBodyTypeEntity>;

  @ManyToOne(() => CatalogFuelTypeEntity, (fuel_type) => fuel_type.versions)
  @JoinColumn({ name: "fuel_type_id" })
  fuel_type: Relation<CatalogFuelTypeEntity>; 

  @ManyToOne(() => CatalogYearEntity, (year) => year.versions)
  @JoinColumn({ name: "year_id" })
  year: Relation<CatalogYearEntity>;
}
