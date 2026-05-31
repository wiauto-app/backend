import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

import { ReportTargetType } from "../entities/report-category";

export interface ReportCategoryFilterOptions {
  target_type?: ReportTargetType;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export class ReportCategoryFilter extends PaginationFilter {
  public readonly target_type?: ReportTargetType;

  constructor(options: ReportCategoryFilterOptions = {}) {
    const {
      target_type,
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.target_type = target_type;
  }
}
