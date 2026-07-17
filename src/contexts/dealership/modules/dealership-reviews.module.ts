import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { DealershipModule } from "../dealership.module";
import { TypeOrmDealershipReviewsRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-reviews-repository";
import { DealershipReviewsController } from "../api/dealership-reviews-v1/dealership-reviews.controller";
import { DealershipReviewEntity } from "../entities/dealership-review.entity";
import { DealershipReviewsService } from "../services/dealership-reviews.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipReviewEntity]),
    forwardRef(() => DealershipModule)],
  controllers: [DealershipReviewsController],
  providers: [
    DealershipReviewsService,
    TypeOrmDealershipReviewsRepository
  ],
  exports: [TypeOrmDealershipReviewsRepository, DealershipReviewsService],
})
export class DealershipReviewsModule {}
