import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { VersionEntity } from "../../catalog/versions/infrastructure/persistence/version.entity";
import type { VehicleImagesEntity } from "../../vehicle-images/infrastructure/persistence/vehicle-images.entity";
import { get_vehicle_images_entity } from "./vehicle-images-entity.relation-type";
import { CONDITION_VEHICLE, ConditionVehicle, PUBLISHER_TYPE, PublisherType, STATUS_VEHICLE, StatusVehicle, TRANSMISSION_TYPE, TransmissionType } from "../../domain/entities/vehicle";
import { VideosEntity } from "./videos.entity";
import { FeaturesEntity } from "./features.entity";
import { VehicleTypeEntity } from "./vehicle-type.entity";
import { ColorEntity } from "./color.entity";
import { ServiceEntity } from "./service.entity";
import { DgtLabelEntity } from "./dgt-label.entity";
import { WarrantyTypeEntity } from "./warranty-type.entity";
import { TractionEntity } from "./traction.entity";




@Entity({ name: "vehicles" })
export class VehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // --- Anuncio ---
  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  price: number;

  @Column()
  mileage: number;

  @Column({ type: "enum", enum: CONDITION_VEHICLE, default: CONDITION_VEHICLE.NEW })
  condition: ConditionVehicle;

  // --- Estado y visibilidad ---
  @Column({ type: "enum", enum: STATUS_VEHICLE, default: STATUS_VEHICLE.PENDING })
  status: StatusVehicle;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ default: 0 })
  views: number;

  @Column({ type: "enum", enum: PUBLISHER_TYPE, default: PUBLISHER_TYPE.PROFESSIONAL })
  publisher_type: PublisherType;

  @Column()
  expires_at: Date;

  // --- Ubicación ---
  @Column({ type: "decimal", precision: 10, scale: 8 })
  lat: number;

  @Column({ type: "decimal", precision: 11, scale: 8 })
  lng: number;

  // --- Ficha técnica (motor / transmisión / identificación) ---
  @Column({ type: "enum", enum: TRANSMISSION_TYPE })
  transmission_type: TransmissionType;

  @Column()
  power: number;

  @Column()
  displacement: number;

  @Column()
  license_plate: string;

  // --- Eléctrico (opcional según modelo) ---
  @Column()
  autonomy: number;

  @Column()
  battery_capacity: number;

  @Column()
  time_to_charge: number;

  // --- Contacto ---
  @Column()
  phone_code: string;

  @Column()
  phone: string;

  @Column()
  email: string;

  // --- Auditoría ---
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // --- Catálogo: versión ---
  @Column()
  version_id: number;

  @ManyToOne(() => VersionEntity, (version) => version.vehicles)
  @JoinColumn({ name: "version_id" })
  version: Relation<VersionEntity>;

  // --- Catálogo: tracción y etiquetas ---
  @ManyToOne(() => TractionEntity, (traction) => traction.vehicles)
  @JoinColumn({ name: "traction_id" })
  traction: Relation<TractionEntity>;

  @ManyToOne(() => VehicleTypeEntity, { nullable: true })
  @JoinColumn({ name: "vehicle_type_id" })
  vehicle_type: Relation<VehicleTypeEntity | null>;

  @ManyToOne(() => ColorEntity, { nullable: true })
  @JoinColumn({ name: "color_id" })
  color: Relation<ColorEntity | null>;

  @ManyToOne(() => DgtLabelEntity, { nullable: true })
  @JoinColumn({ name: "dgt_label_id" })
  dgt_label: Relation<DgtLabelEntity | null>;

  @ManyToOne(() => WarrantyTypeEntity, { nullable: true })
  @JoinColumn({ name: "warranty_type_id" })
  warranty_type: Relation<WarrantyTypeEntity | null>;

  // --- Contenido asociado ---
  @OneToMany(
    () => get_vehicle_images_entity(),
    (vehicle_image: VehicleImagesEntity) => vehicle_image.vehicle,
  )
  images: Relation<VehicleImagesEntity[]>;

  @OneToMany(() => VideosEntity, (video) => video.vehicle)
  videos: Relation<VideosEntity[]>;

  @ManyToMany(() => FeaturesEntity, (feature) => feature.vehicles)
  @JoinTable({ name: "vehicle_features" })
  features: Relation<FeaturesEntity[]>;

  @ManyToMany(() => ServiceEntity, (service) => service.vehicles)
  @JoinTable({ name: "vehicle_services" })
  services: Relation<ServiceEntity[]>;
}
