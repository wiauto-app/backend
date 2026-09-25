import type { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import type {
  SellerLeadListItem,
  SellerLeadTierCounts,
} from "../repositories/typeorm.lead-repository";

export interface SellerLeadsListResponse {
  data: SellerLeadListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  tier_counts: SellerLeadTierCounts | null;
  scoring_locked: boolean;
}

export const toSellerLeadsListResponse = (
  page: PaginatedResult<SellerLeadListItem>,
  tier_counts: SellerLeadTierCounts | null,
  scoring_locked: boolean,
): SellerLeadsListResponse => ({
  data: page.data,
  total: page.total,
  page: page.page,
  limit: page.limit,
  totalPages: page.totalPages,
  hasNextPage: page.hasNextPage,
  tier_counts,
  scoring_locked,
});
