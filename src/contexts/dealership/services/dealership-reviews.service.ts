import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import {
  DealershipReview,
  PrimitiveDealershipReview,
} from "../types/dealership-review";
import { DealershipNotFoundException } from "../exceptions/dealership-not-found.exception";
import { DealershipReviewFilter } from "../types/dealership-review.filter";
import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";
import { TypeOrmDealershipReviewsRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-reviews-repository";
import { RecalculateDealershipRatingService } from "./recalculate-dealership-rating.service";

export interface CreateDealershipReviewInput {
  rating: number;
  comment: string;
  dealership_id: string;
  profile_id: string;
}

export interface FindAllDealershipReviewsInput {
  dealership_id: string;
  profile_id?: string;
  created_since?: Date;
  created_until?: Date;
  page?: number;
  limit?: number;
  query?: string;
  order_by?: string;
  order_direction?: "ASC" | "DESC";
}

@Injectable()
export class DealershipReviewsService {
  constructor(
    private readonly dealership_reviews_repository: TypeOrmDealershipReviewsRepository,
    private readonly dealership_repository: TypeOrmDealershipRepository,
    private readonly recalculate_dealership_rating_service: RecalculateDealershipRatingService,
  ) {}

  async create(
    input: CreateDealershipReviewInput,
  ): Promise<{ review: PrimitiveDealershipReview }> {
    const dealership = await this.dealership_repository.findOne(
      input.dealership_id,
    );
    if (!dealership) {
      throw new DealershipNotFoundException(input.dealership_id);
    }

    const review = DealershipReview.create(input);
    await this.dealership_reviews_repository.save(review);
    await this.recalculate_dealership_rating_service.execute(
      input.dealership_id,
    );
    return { review: review.toPrimitives() };
  }

  async findAll(
    input: FindAllDealershipReviewsInput,
  ): Promise<PaginatedResult<PrimitiveDealershipReview>> {
    const filter = new DealershipReviewFilter(input.dealership_id, {
      profile_id: input.profile_id,
      created_since: input.created_since,
      created_until: input.created_until,
      page: input.page,
      limit: input.limit,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
    });
    const page = await this.dealership_reviews_repository.find_all(filter);
    return page.map((review) => review.toPrimitives());
  }
}
