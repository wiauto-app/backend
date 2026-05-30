import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { DealershipReview } from "../entities/dealership-review";
import { DealershipReviewFilter } from "../filters/dealership-review.filter";

export abstract class DealershipReviewsRepository {
  abstract save(review: DealershipReview): Promise<void>;
  abstract update(review: DealershipReview): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract find_all(
    filter: DealershipReviewFilter,
  ): Promise<PaginatedResult<DealershipReview>>;
  abstract find_one(id: string): Promise<DealershipReview | null>;
}
