import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";

import {
  PrimitiveReportCategory,
  ReportTargetType,
} from "../../domain/entities/report-category";
import { ReportEntity } from "./report.entity";

@Entity({ name: "report_categories" })
export class ReportCategoryEntity implements PrimitiveReportCategory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({
    type: "enum",
    enum: ReportTargetType,
  })
  target_type: ReportTargetType;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ReportEntity, (report) => report.category)
  reports: Relation<ReportEntity[]>;
}
