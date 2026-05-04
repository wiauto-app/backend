import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateReviewsUseCase } from "../application/reviews-use-cases/create-review-use-cases/create-reviews.use-case";
import { FindAllReviewsUseCase } from "../application/reviews-use-cases/find-all-reviews-use-cases/find-all-reviews.use-case";
import { ReviewsRepository } from "../domain/repositories/reviews.repository";
import { ReviewEntity } from "../infrastructure/persistence/review.entity";
import { ReviewsController } from "../infrastructure/http-api/v1/reviews/reviews.controller";
import { TypeormReviewsRepository } from "../infrastructure/repositories/typeorm.reviews-repository";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity]), VehiclesModule],
  controllers: [ReviewsController],
  providers: [
    CreateReviewsUseCase,
    FindAllReviewsUseCase,
    TypeormReviewsRepository,
    {
      provide: ReviewsRepository,
      useExisting: TypeormReviewsRepository,
    },
  ],
  exports: [ReviewsRepository, CreateReviewsUseCase, FindAllReviewsUseCase],
})
export class ReviewsModule {}