import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { DealershipService } from "./services/dealership.service";
import { DealershipScheduleService } from "./services/dealership-schedule.service";
import { RecalculateDealershipRatingService } from "./services/recalculate-dealership-rating.service";
import { TypeOrmDealershipRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-repository";
import { DealershipTeamController } from "./api/v1/dealership-team/dealership-team.controller";
import { CreateDealershipController } from "./api/v1/create-dealership/create-dealership.controller";
import { CreateMyDealershipController } from "./api/v1/create-my-dealership/create-my-dealership.controller";
import { FindAllDealershipsController } from "./api/v1/find-all-dealerships/find-all-dealerships.controller";
import { FindDealershipController } from "./api/v1/find-one-dealership/find-one-dealership.controller";
import { FindDealershipBySlugController } from "./api/v1/find-one-dealership-by-slug/find-one-dealership-by-slug.controller";
import { RemoveDealershipController } from "./api/v1/remove-dealership/remove-dealership.controller";
import { UpdateDealershipController } from "./api/v1/update-dealership/update-dealership.controller";
import { UpdateDealershipSchedulesController } from "./api/v1/update-dealership-schedules/update-dealership-schedules.controller";
import { DealershipEntity } from "./entities/dealership.entity";
import { DealershipInvitationModule } from "./modules/dealership-invitation.module";
import { DealershipReviewsModule } from "./modules/dealership-reviews.module";
import { RemoveFilesService } from "../shared/file/services/remove-files.service";
import { MinioService } from "../shared/minio-provider/minio.service";
import { DealershipSchedule } from "./entities/dealership-schedule.entity";
import { DealershipOpenTime } from "./entities/dealership-open-time.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipEntity, DealershipSchedule, DealershipOpenTime]),
    DealershipInvitationModule,
    forwardRef(() => ProfileModule),
    forwardRef(() => DealershipReviewsModule)],
  controllers: [
    CreateDealershipController,
    CreateMyDealershipController,
    FindAllDealershipsController,
    FindDealershipBySlugController,
    FindDealershipController,
    DealershipTeamController,
    UpdateDealershipController,
    UpdateDealershipSchedulesController,
    RemoveDealershipController],
  providers: [
    DealershipService,
    DealershipScheduleService,
    RemoveFilesService,
    MinioService,
    RecalculateDealershipRatingService,
    TypeOrmDealershipRepository
  ],
  exports: [
    DealershipService,
    DealershipScheduleService,
    TypeOrmDealershipRepository,
    RecalculateDealershipRatingService,
    DealershipInvitationModule],
})
export class DealershipModule {}
