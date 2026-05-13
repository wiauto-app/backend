import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

export interface DealershipsFilterOptions {
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
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
    super(page, limit, order_direction, query, order_by);
    this.name = name;
    this.slug = slug;
    this.email = email;
  }
}
