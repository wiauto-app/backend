import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { PrimitiveCategory } from "../types/category";
import { VehicleEntity } from "./vehicle.entity";
import { OneToMany, Relation } from "typeorm";
@Entity({ name: "categories" })
export class CategoryEntity implements PrimitiveCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: "varchar", nullable: true })
  image_url: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => VehicleEntity, (vehicle) => vehicle.category)
  vehicles: Relation<VehicleEntity[]>;
}
