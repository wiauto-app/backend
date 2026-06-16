import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreateDealershipReviewUseCase } from "../application/dealership-reviews-use-cases/create-dealership-review-use-case/create-dealership-review.use-case";
import { FindAllDealershipReviewsUseCase } from "../application/dealership-reviews-use-cases/find-all-dealership-reviews-use-case/find-all-dealership-reviews.use-case";
import { DealershipReviewsRepository } from "../domain/repositories/dealership-reviews.repository";
import { DealershipReviewsController } from "../infrastructure/http-api/dealership-reviews-v1/dealership-reviews.controller";
import { DealershipReviewEntity } from "../infrastructure/persistence/dealership-review.entity";
import { TypeOrmDealershipReviewsRepository } from "../infrastructure/repositories/typeorm.dealership-reviews-repository";
import { DealershipModule } from "../dealership.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipReviewEntity]),
    forwardRef(() => DealershipModule),
  ],
  controllers: [DealershipReviewsController],
  providers: [
    CreateDealershipReviewUseCase,
    FindAllDealershipReviewsUseCase,
    TypeOrmDealershipReviewsRepository,
    {
      provide: DealershipReviewsRepository,
      useExisting: TypeOrmDealershipReviewsRepository,
    },
  ],
  exports: [
    DealershipReviewsRepository,
    CreateDealershipReviewUseCase,
    FindAllDealershipReviewsUseCase,
  ],
})
export class DealershipReviewsModule {}
