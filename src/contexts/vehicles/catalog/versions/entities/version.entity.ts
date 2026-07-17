import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from "typeorm";
import { VehicleEntity } from "../../../entities/vehicle.entity";
import { MakeEntity } from "../../makes/entities/make.entity";
import { CatalogModelEntity } from "../../models/entities/catalog-model.entity";
import { CatalogBodyTypeEntity } from "../../body_types/entities/catalog-body-type.entity";
import { CatalogFuelTypeEntity } from "../../fuel_types/entities/catalog-fuel-type.entity";
import { CatalogYearEntity } from "../../years/entities/catalog-year.entity";

@Entity({ name: "version" })
@Index("UQ_version_external_version_id", ["version_id"], {
  unique: true,
  where: `"version_id" IS NOT NULL`,
})
@Index("IDX_version_make_id", ["make_id"])
@Index("IDX_version_model_id", ["model_id"])
@Index("IDX_version_body_type_id", ["body_type_id"])
@Index("IDX_version_fuel_type_id", ["fuel_type_id"])
@Index("IDX_version_year_id", ["year_id"])
export class VersionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  /** Identificador externo del crawl (único cuando está presente). */
  @Column({ type: "int", nullable: true })
  version_id: number | null;

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
