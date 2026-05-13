import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";

export interface DealershipInvitationsFilterOptions extends PaginationFilter {
  dealership_id?: string;
  email?: string;
  role?: string;
  status?: "pending" | "accepted" | "revoked" | "expired";
}

export class DealershipInvitationsFilter extends PaginationFilter {
  public readonly dealership_id?: string;
  public readonly email?: string;
  public readonly role?: string;
  public readonly status?: "pending" | "accepted" | "revoked" | "expired";

  constructor(options: DealershipInvitationsFilterOptions ) {
    const {
      dealership_id,
      email,
      role,
      status,
      page = 1,
      limit = 10,
      query,
      order_by,
      order_direction,
    } = options;
    super(page, limit, order_direction, query, order_by);
    this.dealership_id = dealership_id;
    this.email = email;
    this.role = role;
    this.status = status;
  }
}