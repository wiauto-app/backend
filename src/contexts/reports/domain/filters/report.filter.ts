import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

import { ReportStatus } from "../entities/report";
import { ReportTargetType } from "../entities/report-category";

export interface ReportFilterOptions {
  reporter_profile_id?: string;
  target_type?: ReportTargetType;
  status?: ReportStatus;
  category_id?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export class ReportFilter extends PaginationFilter {
  public readonly reporter_profile_id?: string;
  public readonly target_type?: ReportTargetType;
  public readonly status?: ReportStatus;
  public readonly category_id?: string;

  constructor(options: ReportFilterOptions = {}) {
    const {
      reporter_profile_id,
      target_type,
      status,
      category_id,
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.reporter_profile_id = reporter_profile_id;
    this.target_type = target_type;
    this.status = status;
    this.category_id = category_id;
  }
}
