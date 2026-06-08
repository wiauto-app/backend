import { Injectable } from "@nestjs/common";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { ReviewFilter } from "../../../domain/filters/review.filter";
import { ReviewListItem } from "../../../domain/read-models/review-list-item";
import { ReviewsRepository } from "../../../domain/repositories/reviews.repository";
import { FindAllReviewsDto } from "./find-all-reviews.dto";

@Injectable()
export class FindAllReviewsUseCase {
  constructor(private readonly reviews_repository: ReviewsRepository) {}

  async execute(
    dto: FindAllReviewsDto,
  ): Promise<PaginatedResult<ReviewListItem>> {
    const filter = new ReviewFilter(dto.vehicle_id, {
      profile_id: dto.profile_id,
      created_since: dto.created_since,
      created_until: dto.created_until,
      page: dto.page,
      limit: dto.limit,
      query: dto.query,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });
    return this.reviews_repository.find_all(filter);
  }
}
