import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { Review } from "../entities/reviews";
import { ReviewFilter } from "../filters/review.filter";

export abstract class ReviewsRepository {
  abstract save(review: Review): Promise<void>;
  abstract update(review: Review): Promise<void>;
  abstract remove(id: string): Promise<void>;
  abstract find_all(filter: ReviewFilter): Promise<PaginatedResult<Review>>;
  abstract find_one(id: string): Promise<Review | null>;
}
