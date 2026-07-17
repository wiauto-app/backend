import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";

export interface DealershipReviewFilterOptions {
  profile_id?: string;
  created_since?: Date;
  created_until?: Date;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export class DealershipReviewFilter extends PaginationFilter {
  public readonly profile_id?: string;
  public readonly created_since?: Date;
  public readonly created_until?: Date;

  constructor(
    public readonly dealership_id: string,
    options: DealershipReviewFilterOptions = {},
  ) {
    const {
      profile_id,
      created_since,
      created_until,
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.profile_id = profile_id;
    this.created_since = created_since;
    this.created_until = created_until;
  }
}
