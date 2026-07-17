import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import {
  PrimitiveReportCategory,
  ReportTargetType,
} from "../types/report-category";
import { ReportCategoryNotFoundException } from "../exceptions/report-category-not-found.exception";
import {
  ReportCategoryFilter,
  ReportCategoryFilterOptions,
} from "../types/report-category.filter";
import { ReportCategoryEntity } from "../entities/report-category.entity";

const REPORT_CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "target_type",
  "created_at",
  "updated_at",
]);

export interface CreateReportCategoryInput {
  name: string;
  target_type: ReportTargetType;
}

export interface UpdateReportCategoryInput {
  name?: string;
  target_type?: ReportTargetType;
}

@Injectable()
export class ReportCategoriesService {
  constructor(
    @InjectRepository(ReportCategoryEntity)
    private readonly report_category_repository: Repository<ReportCategoryEntity>,
  ) {}

  async create(
    input: CreateReportCategoryInput,
  ): Promise<PrimitiveReportCategory> {
    const name = input.name.trim();
    const row = this.report_category_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
      target_type: input.target_type,
    });
    const saved = await this.report_category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async update(
    id: string,
    input: UpdateReportCategoryInput,
  ): Promise<PrimitiveReportCategory> {
    const existing = await this.report_category_repository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new ReportCategoryNotFoundException(id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    const next_slug =
      input.name === undefined || input.name === existing.name
        ? existing.slug
        : slugify(next_name);
    const next_target_type = input.target_type ?? existing.target_type;

    const row = await this.report_category_repository.preload({
      id,
      name: next_name,
      slug: next_slug,
      target_type: next_target_type,
    });
    if (!row) {
      throw new ReportCategoryNotFoundException(id);
    }

    const saved = await this.report_category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async findAll(
    options: ReportCategoryFilterOptions = {},
  ): Promise<PaginatedResult<PrimitiveReportCategory>> {
    const filter = new ReportCategoryFilter({ ...options });
    const qb =
      this.report_category_repository.createQueryBuilder("report_category");

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
    return new PaginatedResult(
      rows.map((row) => this.toPrimitive(row)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: string): Promise<PrimitiveReportCategory> {
    const category = await this.findById(id);
    if (!category) {
      throw new ReportCategoryNotFoundException(id);
    }
    return category;
  }

  async findById(id: string): Promise<PrimitiveReportCategory | null> {
    const row = await this.report_category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new ReportCategoryNotFoundException(id);
    }
    await this.report_category_repository.delete(id);
  }

  private toPrimitive(row: ReportCategoryEntity): PrimitiveReportCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      target_type: row.target_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
