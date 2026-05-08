import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

export interface DealershipsFilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "asc" | "desc";
  name?: string;
  slug?: string;
  email?: string;
}

export class DealershipsFilter extends PaginationFilter {
  name?: string;
  slug?: string;
  email?: string;

  constructor(options: DealershipsFilterOptions = {}) {
    const {
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
      name,
      slug,
      email,
    } = options;
    super(page, limit, query, order_by, order_direction);
    this.name = name;
    this.slug = slug;
    this.email = email;
  }
}
