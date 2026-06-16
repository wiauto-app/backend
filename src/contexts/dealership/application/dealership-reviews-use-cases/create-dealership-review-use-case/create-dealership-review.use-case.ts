import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import {
  DealershipReview,
  PrimitiveDealershipReview,
} from "../../../domain/entities/dealership-review";
import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";
import { DealershipReviewsRepository } from "../../../domain/repositories/dealership-reviews.repository";
import { RecalculateDealershipRatingService } from "../../dealership/recalculate-dealership-rating/recalculate-dealership-rating.service";
import { CreateDealershipReviewDto } from "./create-dealership-review.dto";

@Injectable()
export class CreateDealershipReviewUseCase {
  constructor(
    private readonly dealership_reviews_repository: DealershipReviewsRepository,
    private readonly dealership_repository: DealershipRepository,
    private readonly recalculate_dealership_rating_service: RecalculateDealershipRatingService,
  ) {}

  async execute(
    create_dealership_review_dto: CreateDealershipReviewDto,
  ): Promise<{ review: PrimitiveDealershipReview }> {
    const dealership = await this.dealership_repository.findOne(
      create_dealership_review_dto.dealership_id,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(
        create_dealership_review_dto.dealership_id,
      );
    }

    const review = DealershipReview.create(create_dealership_review_dto);
    await this.dealership_reviews_repository.save(review);
    await this.recalculate_dealership_rating_service.execute(
      create_dealership_review_dto.dealership_id,
    );
    return { review: review.toPrimitives() };
  }
}
