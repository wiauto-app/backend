import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

export class SearchModelsFilter extends PaginationFilter {
  readonly make_id: number;
  readonly search?: string;
  readonly province_id?: string;
  readonly since_price?: number;
  readonly until_price?: number;

  constructor(options: {
    make_id: number;
    search?: string;
    province_id?: string;
    since_price?: number;
    until_price?: number;
    page?: number;
    limit?: number;
    order_direction?: "ASC" | "DESC";
    query?: string;
    order_by?: string;
  }) {
    const {
      make_id,
      search,
      page,
      limit,
      order_direction,
      query,
      order_by,
      province_id,
      since_price,
      until_price,
    } = options;
    super(page ?? 1, limit ?? 10, order_direction ?? "ASC", query, order_by, search);
    this.make_id = make_id;
    this.search = search;
    this.province_id = province_id;
    this.since_price = since_price;
    this.until_price = until_price;
  }
}
