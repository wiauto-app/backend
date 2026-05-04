import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { ReviewsRepository } from "../../../domain/repositories/reviews.repository";
import { CreateReviewDto } from "./create-review.dto";
import { PrimitiveReview, Review } from "../../../domain/entities/reviews";

@Injectable()
export class CreateReviewsUseCase {
  constructor(
    private readonly reviews_repository: ReviewsRepository,
    private readonly vehicle_repository: VehicleRepository,
  ) {}

  async execute(
    create_review_dto: CreateReviewDto,
  ): Promise<{ review: PrimitiveReview }> {
    const vehicle = await this.vehicle_repository.findOne(
      create_review_dto.vehicle_id,
    );
    if (!vehicle) {
      throw new VehicleNotFoundException(create_review_dto.vehicle_id);
    }
    const review = Review.create(create_review_dto);
    await this.reviews_repository.save(review);
    return { review: review.toPrimitives() };
  }
}