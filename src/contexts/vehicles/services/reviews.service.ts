import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";

import { PrimitiveReview, Review } from "../types/reviews";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { ReviewFilter } from "../types/review.filter";
import { ReviewListItem } from "../types/review-list-item";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeormReviewsRepository } from "../repositories/typeorm.reviews-repository";

export interface CreateReviewInput {
  rating: number;
  comment: string;
  profile_id: string;
  vehicle_id: string;
}

export interface FindAllReviewsInput {
  vehicle_id: string;
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
export class ReviewsService {
  constructor(
    private readonly reviews_repository: TypeormReviewsRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async create(
    input: CreateReviewInput,
  ): Promise<{ review: PrimitiveReview }> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }
    const review = Review.create(input);
    await this.reviews_repository.save(review);
    return { review: review.toPrimitives() };
  }

  async findAll(
    input: FindAllReviewsInput,
  ): Promise<PaginatedResult<ReviewListItem>> {
    const filter = new ReviewFilter(input.vehicle_id, {
      profile_id: input.profile_id,
      created_since: input.created_since,
      created_until: input.created_until,
      page: input.page,
      limit: input.limit,
      query: input.query,
      order_by: input.order_by,
      order_direction: input.order_direction,
    });
    return this.reviews_repository.find_all(filter);
  }
}
