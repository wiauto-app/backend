import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { MakeEntity } from "../../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../../catalog/models/entities/catalog-model.entity";
import { CatalogYearEntity } from "../../catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "../../catalog/versions/entities/version.entity";
import { TRANSMISSION_TYPE, TransmissionType } from "../../types/vehicle";
import {
  APPRAISAL_REQUEST_PRIORITY,
  APPRAISAL_REQUEST_STATUS,
  AppraisalRequestPriority,
  AppraisalRequestStatus,
} from "../types/appraisal-request";

@Entity({ name: "appraisal_requests" })
@Index("IDX_appraisal_requests_status", ["status"])
@Index("IDX_appraisal_requests_priority", ["priority"])
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

  @Column("numeric")
  lat!: number;

  @Column("numeric")
  lng!: number;

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

  @CreateDateColumn({ name: "created_at" })
  created_at!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updated_at!: Date;
}
