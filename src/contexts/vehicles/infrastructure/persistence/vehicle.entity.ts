import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Relation, UpdateDateColumn } from "typeorm";
import { Version } from "../../catalog/versions/entities/version.entity";
import type { VehicleImagesEntity } from "../../vehicle-images/infrastructure/persistence/vehicle-images.entity";
import { get_vehicle_images_entity } from "./vehicle-images-entity.relation-type";


export const STATUS_VEHICLE = {
  ACTIVE: "active",
  PENDING: "pending",
  INACTIVE: "inactive",
  SOLD: "sold",
  ARCHIVED: "archived",
} as const;

@Entity({ name: "vehicles" })
export class VehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  price: number;

  @Column()
  mileage: number;

  @Column({ type: "decimal", precision: 10, scale: 8 })
  lat: number;

  @Column({ type: "decimal", precision: 11, scale: 8 })
  lng: number;

  @Column()
  condition: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: "enum", enum: STATUS_VEHICLE, default: STATUS_VEHICLE.PENDING })
  status: string;

  @Column({ default: false })
  is_featured: boolean;

  @Column()
  expires_at: Date;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column()
  version_id: number;

  @ManyToOne(() => Version, (version) => version.vehicles)
  @JoinColumn({ name: "version_id" })
  version: Relation<Version>;

  @OneToMany(
    () => get_vehicle_images_entity(),
    (vehicle_image: VehicleImagesEntity) => vehicle_image.vehicle,
  )
  images: Relation<VehicleImagesEntity[]>;
}