import type { PrimitiveDealershipReview } from "./dealership-review";

export interface DealershipReviewListItem extends PrimitiveDealershipReview {
  author: string;
  avatar_url: string | null;
}
