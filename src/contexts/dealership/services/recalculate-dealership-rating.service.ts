import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";
import { TypeOrmDealershipReviewsRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-reviews-repository";

@Injectable()
export class RecalculateDealershipRatingService {
  constructor(
    private readonly dealership_reviews_repository: TypeOrmDealershipReviewsRepository,
    private readonly dealership_repository: TypeOrmDealershipRepository,
  ) {}

  async execute(dealership_id: string): Promise<void> {
    const avg_rating =
      await this.dealership_reviews_repository.getAverageRating(dealership_id);
    await this.dealership_repository.updateRating(dealership_id, avg_rating);
  }
}
