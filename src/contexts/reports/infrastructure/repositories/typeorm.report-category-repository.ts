import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ReportCategory } from "../../domain/entities/report-category";
import { ReportCategoryNotFoundException } from "../../domain/exceptions/report-category-not-found.exception";
import { ReportCategoryFilter } from "../../domain/filters/report-category.filter";
import { ReportCategoryRepository } from "../../domain/repositories/report-category.repository";
import { ReportCategoryEntity } from "../persistence/report-category.entity";

const REPORT_CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "target_type",
  "created_at",
  "updated_at",
]);

export class TypeOrmReportCategoryRepository extends ReportCategoryRepository {
  constructor(
    @InjectRepository(ReportCategoryEntity)
    private readonly report_category_repository: Repository<ReportCategoryEntity>,
  ) {
    super();
  }

  async findOne(id: string): Promise<ReportCategory | null> {
    const row = await this.report_category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return ReportCategory.fromPrimitives(row);
  }

  async find_all(
    filter: ReportCategoryFilter,
  ): Promise<PaginatedResult<ReportCategory>> {
    const qb = this.report_category_repository.createQueryBuilder("report_category");

    if (filter.target_type) {
      qb.andWhere("report_category.target_type = :target_type", {
        target_type: filter.target_type,
      });
    }
    if (filter.query?.trim()) {
      qb.andWhere(
        "(report_category.name ILIKE :query OR report_category.slug ILIKE :query)",
        { query: `%${filter.query.trim()}%` },
      );
    }

    const order_column =
      filter.order_by !== undefined &&
      REPORT_CATEGORY_SORT_KEYS.has(filter.order_by)
        ? filter.order_by
        : "created_at";
    const direction = filter.order_direction ?? "DESC";
    qb.orderBy(`report_category.${order_column}`, direction);

    const page = filter.page;
    const limit = filter.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const data = rows.map((row) => ReportCategory.fromPrimitives(row));

    return new PaginatedResult(data, total, page, limit);
  }

  async save(report_category: ReportCategory): Promise<ReportCategory> {
    const saved = await this.report_category_repository.save(
      report_category.toPrimitives(),
    );
    return ReportCategory.fromPrimitives(saved);
  }

  async update(report_category: ReportCategory): Promise<void> {
    const primitive = report_category.toPrimitives();
    const row = await this.report_category_repository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
      target_type: primitive.target_type,
    });
    if (!row) {
      throw new ReportCategoryNotFoundException(primitive.id);
    }
    await this.report_category_repository.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.report_category_repository.delete(id);
  }
}
