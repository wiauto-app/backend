import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";
import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";

import { Report, ReportStatus } from "../types/report";
import { ReportTargetType } from "../types/report-category";
import { ReportCategoryNotFoundException } from "../exceptions/report-category-not-found.exception";
import { ReportCategoryTargetMismatchException } from "../exceptions/report-category-target-mismatch.exception";
import { ReportForbiddenException } from "../exceptions/report-forbidden.exception";
import { ReportNotFoundException } from "../exceptions/report-not-found.exception";
import { ReportSelfTargetForbiddenException } from "../exceptions/report-self-target-forbidden.exception";
import { ReportTargetNotFoundException } from "../exceptions/report-target-not-found.exception";
import {
  ReportFilter,
  ReportFilterOptions,
} from "../types/report.filter";
import { ReportListItem } from "../types/report-list-item";
import { TypeOrmReportRepository } from "../repositories/typeorm.report-repository";
import { ReportCategoriesService } from "./report-categories.service";

export interface CreateReportInput {
  reporter_profile_id: string;
  title: string;
  description: string;
  category_id: string;
  file_url?: string | null;
  target_type: ReportTargetType;
  target_id: string;
}

export interface AdminUpdateReportInput {
  report_id: string;
  status?: ReportStatus;
  admin_notes?: string | null;
}

export interface FindReportInput {
  report_id: string;
  reporter_profile_id: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly report_repository: TypeOrmReportRepository,
    private readonly report_categories_service: ReportCategoriesService,
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly dealership_repository: TypeOrmDealershipRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async create(input: CreateReportInput): Promise<ReportListItem> {
    const category = await this.report_categories_service.findById(
      input.category_id,
    );
    if (!category) {
      throw new ReportCategoryNotFoundException(input.category_id);
    }

    if (category.target_type !== input.target_type) {
      throw new ReportCategoryTargetMismatchException();
    }

    await this.validateTargetExists(input.target_type, input.target_id);

    if (
      input.target_type === ReportTargetType.PROFILE &&
      input.target_id === input.reporter_profile_id
    ) {
      throw new ReportSelfTargetForbiddenException();
    }

    const report = Report.create({
      title: input.title,
      description: input.description,
      file_url: input.file_url,
      category,
      reporter_profile_id: input.reporter_profile_id,
      target_type: input.target_type,
      target_id: input.target_id,
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

  async findAll(
    options: ReportFilterOptions,
  ): Promise<PaginatedResult<ReportListItem>> {
    const filter = new ReportFilter({ ...options });
    return this.report_repository.find_all(filter);
  }

  async findOne(input: FindReportInput): Promise<ReportListItem> {
    const report = await this.report_repository.findOne(input.report_id);
    if (!report) {
      throw new ReportNotFoundException(input.report_id);
    }
    if (report.reporter_profile_id !== input.reporter_profile_id) {
      throw new ReportForbiddenException();
    }
    return report;
  }

  async adminFindOne(report_id: string): Promise<ReportListItem> {
    const report = await this.report_repository.findOne(report_id);
    if (!report) {
      throw new ReportNotFoundException(report_id);
    }
    return report;
  }

  async adminUpdate(input: AdminUpdateReportInput): Promise<ReportListItem> {
    const existing = await this.report_repository.findOne(input.report_id);
    if (!existing) {
      throw new ReportNotFoundException(input.report_id);
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
      status: input.status,
      admin_notes: input.admin_notes,
    });
    await this.report_repository.update(updated);

    const result = await this.report_repository.findOne(input.report_id);
    if (!result) {
      throw new ReportNotFoundException(input.report_id);
    }
    return result;
  }

  async remove(report_id: string): Promise<void> {
    const existing = await this.report_repository.findOne(report_id);
    if (!existing) {
      throw new ReportNotFoundException(report_id);
    }
    await this.report_repository.delete(report_id);
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
