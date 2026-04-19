import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation } from "typeorm";
import { Make } from "../../makes/entities/make.entity";
import { Model } from "../../models/entities/model.entity";
import { BodyType } from "../../body_types/entities/body_type.entity";
import { FuelType } from "../../fuel_types/entities/fuel_type.entity";
import { Year } from "../../years/entities/year.entity";
import { VehicleEntity } from "../../../infrastructure/persistence/vehicle.entity";

@Entity()
export class Version {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  make_id: number;

  @ManyToOne(() => Make, (make) => make.versions)
  @JoinColumn({ name: "make_id" })
  make: Relation<Make>;

  @Column()
  model_id: number;

  @ManyToOne(() => Model, (model) => model.versions)
  @JoinColumn({ name: "model_id" })
  model: Relation<Model>;

  @Column()
  body_type_id: number;

  @ManyToOne(() => BodyType, (bodyType) => bodyType.versions)
  @JoinColumn({ name: "body_type_id" })
  body_type: Relation<BodyType>;

  @Column()
  fuel_type_id: number;

  @ManyToOne(() => FuelType, (fuelType) => fuelType.versions)
  @JoinColumn({ name: "fuel_type_id" })
  fuel_type: Relation<FuelType>;

  @Column()
  year_id: number;

  @ManyToOne(() => Year, (year) => year.versions)
  @JoinColumn({ name: "year_id" })
  year: Relation<Year>;

  @Column()
  name: string;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.version)
  vehicles: Relation<VehicleEntity[]>;
}
