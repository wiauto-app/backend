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
  UpdateDateColumn,
} from "typeorm";

import { MakeEntity } from "../../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../../catalog/models/entities/catalog-model.entity";
import { CatalogYearEntity } from "../../catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "../../catalog/versions/entities/version.entity";
import { TRANSMISSION_TYPE, TransmissionType } from "../../types/vehicle";
import type { RecommendVehiclePriceSource } from "../../dto/recommend-vehicle-price.dto";
import type { VehicleMarketConfidence } from "../../services/vehicle-market-stats.service";
import { AppraisalOfferEntity } from "./appraisal-offer.entity";
import {
  APPRAISAL_REQUEST_PRIORITY,
  APPRAISAL_REQUEST_STATUS,
  AppraisalRequestPriority,
  AppraisalRequestStatus,
} from "../types/appraisal-request";

@Entity({ name: "appraisal_requests" })
@Index("IDX_appraisal_requests_status", ["status"])
@Index("IDX_appraisal_requests_priority", ["priority"])
@Index("IDX_appraisal_requests_profile", ["profile_id"])
export class AppraisalRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  make_id!: number;

  @ManyToOne(() => MakeEntity)
  @JoinColumn({ name: "make_id" })
  make!: Relation<MakeEntity>;

  @Column()
  model_id!: number;

  @ManyToOne(() => CatalogModelEntity)
  @JoinColumn({ name: "model_id" })
  model!: Relation<CatalogModelEntity>;

  @Column()
  year_id!: number;

  @ManyToOne(() => CatalogYearEntity)
  @JoinColumn({ name: "year_id" })
  year!: Relation<CatalogYearEntity>;

  @Column({ type: "int", nullable: true })
  version_id!: number | null;

  @ManyToOne(() => VersionEntity, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "version_id" })
  version!: Relation<VersionEntity> | null;

  @Column({ type: "int", nullable: true })
  fuel_type_id!: number | null;

  @Column({ type: "int", nullable: true })
  body_type_id!: number | null;

  @Column({ type: "enum", enum: TRANSMISSION_TYPE })
  transmission_type!: TransmissionType;

  @Column()
  mileage!: number;

  @Column({ type: "numeric", nullable: true })
  lat!: number | null;

  @Column({ type: "numeric", nullable: true })
  lng!: number | null;

  @Column({ type: "text", nullable: true })
  address!: string | null;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  phone_code!: string;

  @Column()
  phone!: string;

  @Column({
    type: "enum",
    enum: APPRAISAL_REQUEST_STATUS,
    default: APPRAISAL_REQUEST_STATUS.PENDING,
  })
  status!: AppraisalRequestStatus;

  @Column({
    type: "enum",
    enum: APPRAISAL_REQUEST_PRIORITY,
    default: APPRAISAL_REQUEST_PRIORITY.LOW,
  })
  priority!: AppraisalRequestPriority;

  @Column({ type: "uuid", nullable: true })
  profile_id!: string | null;

  @Column({ type: "numeric", nullable: true })
  estimated_price_min!: number | null;

  @Column({ type: "numeric", nullable: true })
  estimated_price_max!: number | null;

  @Column({ type: "text", nullable: true })
  admin_note!: string | null;

  @Column({ type: "timestamp", nullable: true })
  answered_at!: Date | null;

  @Column({ type: "numeric", nullable: true })
  recommended_price!: number | null;

  @Column({ type: "text", nullable: true })
  ai_explanation!: string | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  ai_confidence!: VehicleMarketConfidence | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  ai_source!: RecommendVehiclePriceSource | null;

  @Column({ type: "int", nullable: true })
  power!: number | null;

  @Column({ type: "varchar", length: 16, nullable: true })
  plate!: string | null;

  @Column({ type: "timestamptz", nullable: true })
  offers_requested_at!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  offers_expire_at!: Date | null;

  @Column({ type: "uuid", nullable: true })
  accepted_offer_id!: string | null;

  @OneToMany(() => AppraisalOfferEntity, (offer) => offer.appraisal_request)
  offers!: Relation<AppraisalOfferEntity[]>;

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
