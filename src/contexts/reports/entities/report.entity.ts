import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";
import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import { ReportStatus } from "../types/report";
import { ReportTargetType } from "../types/report-category";
import { ReportCategoryEntity } from "./report-category.entity";

@Entity({ name: "reports" })
export class ReportEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "varchar", nullable: true })
  file_url: string | null;

  @Column({
    type: "enum",
    enum: ReportStatus,
    default: ReportStatus.OPEN,
  })
  status: ReportStatus;

  @Column()
  category_id: string;

  @Column()
  reporter_profile_id: string;

  @Column({
    type: "enum",
    enum: ReportTargetType,
  })
  target_type: ReportTargetType;

  @Column({ type: "uuid", nullable: true })
  target_profile_id: string | null;

  @Column({ type: "uuid", nullable: true })
  target_dealership_id: string | null;

  @Column({ type: "uuid", nullable: true })
  target_vehicle_id: string | null;

  @Column({ type: "text", nullable: true })
  admin_notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => ReportCategoryEntity, (category) => category.reports, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "category_id" })
  category: Relation<ReportCategoryEntity>;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "reporter_profile_id" })
  reporter_profile: Relation<ProfileEntity>;

  @ManyToOne(() => ProfileEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "target_profile_id" })
  target_profile: Relation<ProfileEntity | null>;

  @ManyToOne(() => DealershipEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "target_dealership_id" })
  target_dealership: Relation<DealershipEntity | null>;

  @ManyToOne(() => VehicleEntity, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "target_vehicle_id" })
  target_vehicle: Relation<VehicleEntity | null>;
}
