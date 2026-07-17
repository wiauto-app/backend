import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { PrimitiveReportCategory, ReportTargetType } from "./report-category";

export { ReportTargetType } from "./report-category";

export enum ReportStatus {
  OPEN = "open",
  IN_REVIEW = "in_review",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
  ESCALATED = "escalated",
}

export interface PrimitiveReport {
  id: string;
  title: string;
  description: string;
  file_url: string | null;
  status: ReportStatus;
  category: PrimitiveReportCategory;
  reporter_profile_id: string;
  target_type: ReportTargetType;
  target_profile_id: string | null;
  target_dealership_id: string | null;
  target_vehicle_id: string | null;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export class Report {
  constructor(private readonly primitive_report: PrimitiveReport) {}

  static create(payload: {
    title: string;
    description: string;
    file_url?: string | null;
    category: PrimitiveReportCategory;
    reporter_profile_id: string;
    target_type: ReportTargetType;
    target_id: string;
  }): Report {
    const target_profile_id =
      payload.target_type === ReportTargetType.PROFILE ? payload.target_id : null;
    const target_dealership_id =
      payload.target_type === ReportTargetType.DEALERSHIP
        ? payload.target_id
        : null;
    const target_vehicle_id =
      payload.target_type === ReportTargetType.VEHICLE ? payload.target_id : null;

    return new Report({
      id: uuidv4(),
      title: payload.title,
      description: payload.description,
      file_url: payload.file_url ?? null,
      category: payload.category,
      reporter_profile_id: payload.reporter_profile_id,
      target_type: payload.target_type,
      target_profile_id,
      target_dealership_id,
      target_vehicle_id,
      status: ReportStatus.OPEN,
      admin_notes: null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(payload: {
    status?: ReportStatus;
    admin_notes?: string | null;
  }): Report {
    return new Report({
      ...this.primitive_report,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(primitive: PrimitiveReport): Report {
    return new Report(primitive);
  }

  toPrimitives(): PrimitiveReport {
    return {
      ...this.primitive_report,
    };
  }
}
