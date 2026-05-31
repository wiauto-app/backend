import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipRepository } from "@/src/contexts/dealership/domain/repositories/dealership.repository";
import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";

import { Report } from "../../../domain/entities/report";
import { ReportTargetType } from "../../../domain/entities/report-category";
import { ReportCategoryNotFoundException } from "../../../domain/exceptions/report-category-not-found.exception";
import { ReportCategoryTargetMismatchException } from "../../../domain/exceptions/report-category-target-mismatch.exception";
import { ReportSelfTargetForbiddenException } from "../../../domain/exceptions/report-self-target-forbidden.exception";
import { ReportTargetNotFoundException } from "../../../domain/exceptions/report-target-not-found.exception";
import { ReportListItem } from "../../../domain/read-models/report-list-item";
import { ReportCategoryRepository } from "../../../domain/repositories/report-category.repository";
import { ReportRepository } from "../../../domain/repositories/report.repository";
import { CreateReportDto } from "./create-report.dto";

@Injectable()
export class CreateReportUseCase {
  constructor(
    private readonly report_repository: ReportRepository,
    private readonly report_category_repository: ReportCategoryRepository,
    private readonly profile_repository: ProfileRepository,
    private readonly dealership_repository: DealershipRepository,
    private readonly vehicle_repository: VehicleRepository,
  ) {}

  async execute(dto: CreateReportDto): Promise<ReportListItem> {
    const category = await this.report_category_repository.findOne(
      dto.category_id,
    );
    if (!category) {
      throw new ReportCategoryNotFoundException(dto.category_id);
    }

    const category_primitive = category.toPrimitives();
    if (category_primitive.target_type !== dto.target_type) {
      throw new ReportCategoryTargetMismatchException();
    }

    await this.validateTargetExists(dto.target_type, dto.target_id);

    if (
      dto.target_type === ReportTargetType.PROFILE &&
      dto.target_id === dto.reporter_profile_id
    ) {
      throw new ReportSelfTargetForbiddenException();
    }

    const report = Report.create({
      title: dto.title,
      description: dto.description,
      file_url: dto.file_url,
      category: category_primitive,
      reporter_profile_id: dto.reporter_profile_id,
      target_type: dto.target_type,
      target_id: dto.target_id,
    });
    await this.report_repository.save(report);

    const created = await this.report_repository.findOne(
      report.toPrimitives().id,
    );
    if (!created) {
      throw new Error("Denuncia recién creada no encontrada");
    }
    return created;
  }

  private async validateTargetExists(
    target_type: ReportTargetType,
    target_id: string,
  ): Promise<void> {
    switch (target_type) {
      case ReportTargetType.PROFILE: {
        const profile = await this.profile_repository.findOne(target_id);
        if (!profile) {
          throw new ReportTargetNotFoundException(target_type, target_id);
        }
        return;
      }
      case ReportTargetType.DEALERSHIP: {
        const dealership = await this.dealership_repository.findOne(target_id);
        if (!dealership) {
          throw new ReportTargetNotFoundException(target_type, target_id);
        }
        return;
      }
      case ReportTargetType.VEHICLE: {
        const vehicle = await this.vehicle_repository.findOne(target_id);
        if (!vehicle) {
          throw new ReportTargetNotFoundException(target_type, target_id);
        }
        return;
      }
    }
  }
}
