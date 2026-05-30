import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { PrimitiveDealershipReview } from "../../../domain/entities/dealership-review";
import { DealershipReviewFilter } from "../../../domain/filters/dealership-review.filter";
import { DealershipReviewsRepository } from "../../../domain/repositories/dealership-reviews.repository";
import { FindAllDealershipReviewsDto } from "./find-all-dealership-reviews.dto";

@Injectable()
export class FindAllDealershipReviewsUseCase {
  constructor(
    private readonly dealership_reviews_repository: DealershipReviewsRepository,
  ) {}

  async execute(
    dto: FindAllDealershipReviewsDto,
  ): Promise<PaginatedResult<PrimitiveDealershipReview>> {
    const filter = new DealershipReviewFilter(dto.dealership_id, {
      profile_id: dto.profile_id,
      created_since: dto.created_since,
      created_until: dto.created_until,
      page: dto.page,
      limit: dto.limit,
      query: dto.query,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });
    const page = await this.dealership_reviews_repository.find_all(filter);
    return page.map((review) => review.toPrimitives());
  }
}
