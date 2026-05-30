import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

import { TicketStatus } from "../entities/ticket";

export interface TicketFilterOptions {
  profile_id?: string;
  status?: TicketStatus;
  category_id?: string;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

export class TicketFilter extends PaginationFilter {
  public readonly profile_id?: string;
  public readonly status?: TicketStatus;
  public readonly category_id?: string;

  constructor(options: TicketFilterOptions = {}) {
    const {
      profile_id,
      status,
      category_id,
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.profile_id = profile_id;
    this.status = status;
    this.category_id = category_id;
  }
}
