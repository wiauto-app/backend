import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipRepository } from "../../../domain/repositories/dealership.repository";
import { DealershipReviewsRepository } from "../../../domain/repositories/dealership-reviews.repository";

@Injectable()
export class RecalculateDealershipRatingService {
  constructor(
    private readonly dealership_reviews_repository: DealershipReviewsRepository,
    private readonly dealership_repository: DealershipRepository,
  ) {}

  async execute(dealership_id: string): Promise<void> {
    const avg_rating =
      await this.dealership_reviews_repository.getAverageRating(dealership_id);
    await this.dealership_repository.updateRating(dealership_id, avg_rating);
  }
}
