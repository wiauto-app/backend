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

import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";

import {
  APPRAISAL_OFFER_STATUS,
  type AppraisalOfferStatus,
} from "../types/appraisal-offer";
import { AppraisalRequestEntity } from "./appraisal-request.entity";

@Entity({ name: "appraisal_offers" })
@Index("IDX_appraisal_offers_request", ["appraisal_request_id"])
export class AppraisalOfferEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  appraisal_request_id!: string;

  @ManyToOne(() => AppraisalRequestEntity, (request) => request.offers, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "appraisal_request_id" })
  appraisal_request!: Relation<AppraisalRequestEntity>;

  @Column({ type: "uuid" })
  dealership_id!: string;

  @ManyToOne(() => DealershipEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "dealership_id" })
  dealership!: Relation<DealershipEntity>;

  @Column({ type: "uuid" })
  created_by_profile_id!: string;

  @Column({ type: "numeric" })
  amount!: number;

  @Column({ type: "text", nullable: true })
  message!: string | null;

  @Column({
    type: "enum",
    enum: APPRAISAL_OFFER_STATUS,
    default: APPRAISAL_OFFER_STATUS.PENDING,
  })
  status!: AppraisalOfferStatus;

  @Column({ type: "timestamptz", nullable: true })
  responded_at!: Date | null;

  @CreateDateColumn({ type: "timestamptz" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at!: Date;
}
