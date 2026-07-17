import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { VersionEntity } from "../catalog/versions/entities/version.entity";
import type { VehicleImagesEntity } from "../vehicle-images/entities/vehicle-images.entity";
import type { VehiclePriceEntity } from "../vehicle-prices/entities/vehicle-price.entity";
import { get_vehicle_images_entity } from "./vehicle-images-entity.relation-type";
import { get_vehicle_prices_entity } from "./vehicle-prices-entity.relation-type";
import { CONDITION_VEHICLE, ConditionVehicle, PUBLISHER_TYPE, PublisherType, STATUS_VEHICLE, StatusVehicle, TRANSMISSION_TYPE, TransmissionType } from "../types/vehicle";
import { VideosEntity } from "./videos.entity";
import { FeaturesEntity } from "./features.entity";
import { VehicleTypeEntity } from "./vehicle-type.entity";
import { ColorEntity } from "./color.entity";
import { ServiceEntity } from "./service.entity";
import { DgtLabelEntity } from "./dgt-label.entity";
import { WarrantyTypeEntity } from "./warranty-type.entity";
import { TractionEntity } from "./traction.entity";
import { CuotaEntity } from "./cuota.entity";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { ReviewEntity } from "./review.entity";
import { CategoryEntity } from "./category.entity";
import type { VehicleAddressDetails } from "../types/vehicle-address-details";

@Entity({ name: "vehicles" })
@Index("IDX_vehicles_version_id", ["version_id"])
export class VehicleEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // --- Anuncio ---
  @Column({ type: "varchar", nullable: true })
  description?: string | null;

  @Column()
  mileage: number;

  @Column({ type: "enum", enum: CONDITION_VEHICLE, default: CONDITION_VEHICLE.NEW })
  condition: ConditionVehicle;

  // --- Estado y visibilidad ---
  @Column({ type: "enum", enum: STATUS_VEHICLE, default: STATUS_VEHICLE.PENDING })
  status: StatusVehicle;

  @Column({ type: "text", nullable: true })
  status_change_message?: string | null;

  @Column({ type: "text", nullable: true })
  address?: string | null;

  @Column({ type: "jsonb", nullable: true })
  address_details?: VehicleAddressDetails | null;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ name: "featured_expires_at", type: "timestamp", nullable: true })
  featured_expires_at: Date | null;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  favorites: number;

  @Column({ default: 0 })
  shares: number;

  @Column({ type: "enum", enum: PUBLISHER_TYPE, default: PUBLISHER_TYPE.PROFESSIONAL })
  publisher_type: PublisherType;

  @Column()
  expires_at: Date;

  @Column({ type: "timestamp", nullable: true })
  scheduled_publish_at: Date | null;

  @Column({ type: "timestamp", nullable: true })
  renewed_at: Date | null;

  // --- Ubicación ---
  @Column("numeric")
  lat: number;

  @Column("numeric")
  lng: number;

  // --- Ficha técnica (motor / transmisión / identificación) ---
  @Column({ type: "enum", enum: TRANSMISSION_TYPE })
  transmission_type: TransmissionType;

  @Column({
    type: "numeric",
    nullable: true,
  })
  power: number;

  @Column()
  displacement: number;

  @Column()
  license_plate: string;

  @Column({ nullable: true })
  vin_code?: string;

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

  @Column({ name: "has_whatsapp", type: "boolean", default: false })
  has_whatsapp: boolean;

  @Column({ name: "show_phone", type: "boolean", default: true })
  show_phone: boolean;

  @Column()
  email: string;

  // --- Auditoría ---
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: "uuid", nullable: true })
  category_id?: string;

  @ManyToOne(() => CategoryEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "category_id" })
  category: Relation<CategoryEntity | null>;

  // --- Catálogo: versión ---
  @Column()
  version_id: number;

  @ManyToOne(() => VersionEntity, (version) => version.vehicles)
  @JoinColumn({ name: "version_id" })
  version: Relation<VersionEntity>;

  // --- Catálogo: tracción y etiquetas ---
  @ManyToOne(() => TractionEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "traction_id" })
  traction: Relation<TractionEntity>;

  @ManyToOne(() => VehicleTypeEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "vehicle_type_id" })
  vehicle_type: Relation<VehicleTypeEntity | null>;

  @ManyToOne(() => ColorEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "color_id" })
  color: Relation<ColorEntity | null>;

  @ManyToOne(() => DgtLabelEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "dgt_label_id" })
  dgt_label: Relation<DgtLabelEntity | null>;

  @ManyToOne(() => WarrantyTypeEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "warranty_type_id" })
  warranty_type: Relation<WarrantyTypeEntity | null>;

  @ManyToMany(() => CuotaEntity)
  @JoinTable({
    name: "vehicle_cuotas",
    joinColumn: { name: "vehicle_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "cuota_id", referencedColumnName: "id" },
  })
  cuotas: Relation<CuotaEntity[]>;

  // --- Contenido asociado ---
  @OneToMany(
    () => get_vehicle_images_entity(),
    (vehicle_image: VehicleImagesEntity) => vehicle_image.vehicle,
  )
  images?: Relation<VehicleImagesEntity[]>;

  @OneToMany(
    () => get_vehicle_prices_entity(),
    (vehicle_price: VehiclePriceEntity) => vehicle_price.vehicle,
  )
  vehicle_prices?: Relation<VehiclePriceEntity[]>;

  @OneToMany(() => VideosEntity, (video) => video.vehicle)
  videos?: Relation<VideosEntity[]>;

  @ManyToMany(() => FeaturesEntity, (feature) => feature.vehicles)
  @JoinTable({ name: "vehicle_features" })
  features?: Relation<FeaturesEntity[]>;

  @ManyToMany(() => ServiceEntity, (service) => service.vehicles)
  @JoinTable({ name: "vehicle_services" })
  services?: Relation<ServiceEntity[]>;

  @Column({ type: "jsonb", default: [] })
  suggestions: string[];



  @ManyToOne(() => ProfileEntity, (profile) => profile.vehicles)
  @JoinColumn({ name: "profile_id" })
  profile: Relation<ProfileEntity>;

  @OneToMany(() => ReviewEntity, (review) => review.vehicle)
  reviews: Relation<ReviewEntity[]>;

  @DeleteDateColumn()
  deleted_at?: Date;
}
