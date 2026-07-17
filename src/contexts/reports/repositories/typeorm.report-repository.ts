import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
import { formatVehicleDisplayName } from "@/src/contexts/vehicles/utils/format-vehicle-display-name";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Report } from "../types/report";
import { ReportTargetType } from "../types/report-category";
import { ReportNotFoundException } from "../exceptions/report-not-found.exception";
import { ReportFilter } from "../types/report.filter";
import { ReportListItem } from "../types/report-list-item";
import { ReportEntity } from "../entities/report.entity";

const REPORT_SORT_KEYS = new Set([
  "id",
  "title",
  "status",
  "target_type",
  "created_at",
  "updated_at",
]);

const resolve_target_id = (row: ReportEntity): string => {
  switch (row.target_type) {
    case ReportTargetType.PROFILE:
      return row.target_profile_id ?? "";
    case ReportTargetType.DEALERSHIP:
      return row.target_dealership_id ?? "";
    case ReportTargetType.VEHICLE:
      return row.target_vehicle_id ?? "";
  }
};

const resolve_target_label = (row: ReportEntity): string => {
  switch (row.target_type) {
    case ReportTargetType.PROFILE:
      return row.target_profile?.name ?? "";
    case ReportTargetType.DEALERSHIP:
      return row.target_dealership?.name ?? "";
    case ReportTargetType.VEHICLE:
      if (!row.target_vehicle?.version) {
        return "";
      }
      return formatVehicleDisplayName({
        make_name: row.target_vehicle.version.make?.name,
        model_name: row.target_vehicle.version.model?.name,
        version_name: row.target_vehicle.version.name,
      });
  }
};

const resolve_implicated_profile_id = (
  row: ReportEntity,
  raw: Record<string, unknown>,
): string | null => {
  switch (row.target_type) {
    case ReportTargetType.PROFILE:
      return row.target_profile_id;
    case ReportTargetType.VEHICLE:
      return row.target_vehicle?.profile?.id ?? null;
    case ReportTargetType.DEALERSHIP:
      return (raw.implicated_dealership_profile_id as string | undefined) ?? null;
  }
};

const resolve_implicated_label = (
  row: ReportEntity,
  raw: Record<string, unknown>,
): string | null => {
  switch (row.target_type) {
    case ReportTargetType.PROFILE:
      return row.target_profile?.name ?? null;
    case ReportTargetType.VEHICLE:
      return row.target_vehicle?.profile?.name ?? null;
    case ReportTargetType.DEALERSHIP:
      return (raw.implicated_dealership_profile_name as string | undefined) ?? null;
  }
};

const resolve_implicated_is_suspended = (
  row: ReportEntity,
  raw: Record<string, unknown>,
): boolean => {
  switch (row.target_type) {
    case ReportTargetType.PROFILE:
      return row.target_profile?.user?.is_suspended ?? false;
    case ReportTargetType.VEHICLE:
      return row.target_vehicle?.profile?.user?.is_suspended ?? false;
    case ReportTargetType.DEALERSHIP:
      return Boolean(raw.implicated_dealership_profile_user_is_suspended);
  }
};

const resolve_vehicle_id_for_chat = (row: ReportEntity): string | null => {
  if (row.target_type !== ReportTargetType.VEHICLE) {
    return null;
  }
  return row.target_vehicle_id;
};

const entity_to_list_item = (
  row: ReportEntity,
  raw: Record<string, unknown>,
): ReportListItem => ({
  id: row.id,
  title: row.title,
  description: row.description,
  file_url: row.file_url,
  status: row.status,
  target_type: row.target_type,
  target_id: resolve_target_id(row),
  target_label: resolve_target_label(row),
  reporter_profile_id: row.reporter_profile_id,
  reporter_label: row.reporter_profile?.name ?? "",
  implicated_profile_id: resolve_implicated_profile_id(row, raw),
  implicated_label: resolve_implicated_label(row, raw),
  implicated_is_suspended: resolve_implicated_is_suspended(row, raw),
  vehicle_id_for_chat: resolve_vehicle_id_for_chat(row),
  admin_notes: row.admin_notes,
  created_at: row.created_at,
  updated_at: row.updated_at,
  category: {
    id: row.category.id,
    name: row.category.name,
    slug: row.category.slug,
    target_type: row.category.target_type,
    created_at: row.category.created_at,
    updated_at: row.category.updated_at,
  },
});

@Injectable()
export class TypeOrmReportRepository {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly report_repository: Repository<ReportEntity>,
  ) {}

  private build_list_query() {
    return this.report_repository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.category", "category")
      .leftJoinAndSelect("report.reporter_profile", "reporter_profile")
      .leftJoinAndSelect("report.target_profile", "target_profile")
      .leftJoinAndSelect("target_profile.user", "target_profile_user")
      .leftJoinAndSelect("report.target_dealership", "target_dealership")
      .leftJoinAndSelect("report.target_vehicle", "target_vehicle")
      .leftJoinAndSelect("target_vehicle.version", "target_vehicle_version")
      .leftJoinAndSelect("target_vehicle_version.make", "target_vehicle_make")
      .leftJoinAndSelect("target_vehicle_version.model", "target_vehicle_model")
      .leftJoinAndSelect("target_vehicle.profile", "target_vehicle_profile")
      .leftJoinAndSelect("target_vehicle_profile.user", "target_vehicle_profile_user")
      .leftJoin(
        DealershipMembersEntity,
        "implicated_dealership_member",
        `implicated_dealership_member.dealership_id = report.target_dealership_id AND implicated_dealership_member.id = (
          SELECT dm.id FROM dealership_members dm
          WHERE dm.dealership_id = report.target_dealership_id
          AND dm.role IN ('owner', 'admin')
          ORDER BY CASE WHEN dm.role = 'owner' THEN 0 ELSE 1 END, dm.created_at ASC
          LIMIT 1
        )`,
      )
      .leftJoinAndSelect("implicated_dealership_member.profile", "implicated_dealership_profile")
      .leftJoinAndSelect(
        "implicated_dealership_profile.user",
        "implicated_dealership_profile_user",
      );
  }

  async findOne(id: string): Promise<ReportListItem | null> {
    const { entities, raw } = await this.build_list_query()
      .where("report.id = :id", { id })
      .getRawAndEntities();

    const row = entities[0];

    if (!row || !row.category) {
      return null;
    }

    return entity_to_list_item(row, raw[0] ?? {});
  }

  async find_all(filter: ReportFilter): Promise<PaginatedResult<ReportListItem>> {
    const qb = this.build_list_query();

    if (filter.reporter_profile_id) {
      qb.andWhere("report.reporter_profile_id = :reporter_profile_id", {
        reporter_profile_id: filter.reporter_profile_id,
      });
    }
    if (filter.target_type) {
      qb.andWhere("report.target_type = :target_type", {
        target_type: filter.target_type,
      });
    }
    if (filter.status) {
      qb.andWhere("report.status = :status", { status: filter.status });
    }
    if (filter.category_id) {
      qb.andWhere("report.category_id = :category_id", {
        category_id: filter.category_id,
      });
    }
    if (filter.query?.trim()) {
      qb.andWhere(
        "(report.title ILIKE :query OR report.description ILIKE :query)",
        { query: `%${filter.query.trim()}%` },
      );
    }

    const order_column =
      filter.order_by !== undefined && REPORT_SORT_KEYS.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction ?? "DESC";
    qb.orderBy(`report.${order_column}`, direction);

    const page = filter.page;
    const limit = filter.limit;

    const count_qb = qb.clone();
    const total = await count_qb.getCount();

    qb.skip((page - 1) * limit).take(limit);

    const { entities, raw } = await qb.getRawAndEntities();
    const data = entities
      .map((row, index) => ({ row, raw: raw[index] ?? {} }))
      .filter(({ row }) => row.category)
      .map(({ row, raw: raw_row }) => entity_to_list_item(row, raw_row));

    return new PaginatedResult(data, total, page, limit);
  }

  async save(report: Report): Promise<Report> {
    const primitive = report.toPrimitives();
    const saved = await this.report_repository.save(
      this.report_repository.create({
        id: primitive.id,
        title: primitive.title,
        description: primitive.description,
        file_url: primitive.file_url,
        status: primitive.status,
        category_id: primitive.category.id,
        reporter_profile_id: primitive.reporter_profile_id,
        target_type: primitive.target_type,
        target_profile_id: primitive.target_profile_id,
        target_dealership_id: primitive.target_dealership_id,
        target_vehicle_id: primitive.target_vehicle_id,
        admin_notes: primitive.admin_notes,
        created_at: primitive.created_at,
        updated_at: primitive.updated_at,
      }),
    );

    return Report.fromPrimitives({
      ...primitive,
      id: saved.id,
      created_at: saved.created_at,
      updated_at: saved.updated_at,
    });
  }

  async update(report: Report): Promise<void> {
    const primitive = report.toPrimitives();
    const row = await this.report_repository.preload({
      id: primitive.id,
      status: primitive.status,
      admin_notes: primitive.admin_notes,
    });
    if (!row) {
      throw new ReportNotFoundException(primitive.id);
    }
    await this.report_repository.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.report_repository.delete(id);
  }
}