import { Injectable } from "@nestjs/common";

import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { PrimitiveReview } from "../../../domain/entities/reviews";
import { ReviewFilter } from "../../../domain/filters/review.filter";
import { ReviewsRepository } from "../../../domain/repositories/reviews.repository";
import { FindAllReviewsDto } from "./find-all-reviews.dto";

@Injectable()
export class FindAllReviewsUseCase {
  constructor(private readonly reviews_repository: ReviewsRepository) {}

  async execute(
    dto: FindAllReviewsDto,
  ): Promise<PaginatedResult<PrimitiveReview>> {
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
    const page = await this.reviews_repository.find_all(filter);
    return page.map((r) => r.toPrimitives());
  }
}
