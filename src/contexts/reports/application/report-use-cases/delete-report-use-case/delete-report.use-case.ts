import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ReportNotFoundException } from "../../../domain/exceptions/report-not-found.exception";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { DeleteReportDto } from "./delete-report.dto";

@Injectable()
export class DeleteReportUseCase {
  constructor(private readonly report_repository: ReportRepository) {}

  async execute(dto: DeleteReportDto): Promise<void> {
    const existing = await this.report_repository.findOne(dto.report_id);
    if (!existing) {
      throw new ReportNotFoundException(dto.report_id);
    }
    await this.report_repository.delete(dto.report_id);
  }
}
