import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { VehicleEntity } from "./vehicle.entity";

@Entity({ name: "features" })
export class FeaturesEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  slug: string;

  @Column({ type: "varchar", length: 64 })
  category: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToMany(() => VehicleEntity, (vehicle) => vehicle.features)
  vehicles: Relation<VehicleEntity[]>;
}