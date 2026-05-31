import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { Report } from "../../../domain/entities/report";
import { ReportTargetType } from "../../../domain/entities/report-category";
import { ReportNotFoundException } from "../../../domain/exceptions/report-not-found.exception";
import { ReportListItem } from "../../../domain/read-models/report-list-item";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { AdminUpdateReportDto } from "./admin-update-report.dto";

@Injectable()
export class AdminUpdateReportUseCase {
  constructor(private readonly report_repository: ReportRepository) {}

  async execute(dto: AdminUpdateReportDto): Promise<ReportListItem> {
    const existing = await this.report_repository.findOne(dto.report_id);
    if (!existing) {
      throw new ReportNotFoundException(dto.report_id);
    }

    const report = Report.fromPrimitives({
      id: existing.id,
      title: existing.title,
      description: existing.description,
      file_url: existing.file_url,
      status: existing.status,
      reporter_profile_id: existing.reporter_profile_id,
      target_type: existing.target_type,
      target_profile_id:
        existing.target_type === ReportTargetType.PROFILE
          ? existing.target_id
          : null,
      target_dealership_id:
        existing.target_type === ReportTargetType.DEALERSHIP
          ? existing.target_id
          : null,
      target_vehicle_id:
        existing.target_type === ReportTargetType.VEHICLE
          ? existing.target_id
          : null,
      admin_notes: existing.admin_notes,
      created_at: existing.created_at,
      updated_at: existing.updated_at,
      category: existing.category,
    });

    const updated = report.update({
      status: dto.status,
      admin_notes: dto.admin_notes,
    });
    await this.report_repository.update(updated);

    const result = await this.report_repository.findOne(dto.report_id);
    if (!result) {
      throw new ReportNotFoundException(dto.report_id);
    }
    return result;
  }
}
