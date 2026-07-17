import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ReviewEntity } from "../entities/review.entity";
import { ReviewsController } from "../api/v1/reviews/reviews.controller";
import { TypeormReviewsRepository } from "../repositories/typeorm.reviews-repository";
import { ReviewsService } from "../services/reviews.service";
import { VehiclesModule } from "../vehicles.module";

@Module({
  imports: [TypeOrmModule.forFeature([ReviewEntity]), VehiclesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService, TypeormReviewsRepository],
  exports: [ReviewsService, TypeormReviewsRepository],
})
export class ReviewsModule {}
