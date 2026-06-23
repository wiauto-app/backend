import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileModule } from "@/src/contexts/profiles/profile.module";

import { SyncDealershipMembersUseCase } from "./application/dealership-members/sync-dealership-members-use-case/sync-dealership-members.use-case";
import { FindDealershipTeamUseCase } from "./application/dealership-members/find-dealership-team-use-case/find-dealership-team.use-case";
import { LeaveDealershipTeamUseCase } from "./application/dealership-members/leave-dealership-team-use-case/leave-dealership-team.use-case";
import { RemoveDealershipMemberUseCase } from "./application/dealership-members/remove-dealership-member-use-case/remove-dealership-member.use-case";
import { UpdateDealershipMemberRoleUseCase } from "./application/dealership-members/update-dealership-member-role-use-case/update-dealership-member-role.use-case";
import { CreateDealershipUseCase } from "./application/dealership/create-dealership-use-case/create-dealership.use-case";
import { CreateMyDealershipUseCase } from "./application/dealership/create-my-dealership-use-case/create-my-dealership.use-case";
import { FindAllDealershipUseCase } from "./application/dealership/find-all-dealership-use-case/find-all-dealership.use-case";
import { FindOneDealershipUseCase } from "./application/dealership/find-one-dealership-use-case/find-one-dealership.use-case";
import { FindOneDealershipBySlugUseCase } from "./application/dealership/find-one-dealership-by-slug-use-case/find-one-dealership-by-slug.use-case";
import { RecalculateDealershipRatingService } from "./application/dealership/recalculate-dealership-rating/recalculate-dealership-rating.service";
import { RemoveDealershipUseCase } from "./application/dealership/remove-dealership-use-case/remove-dealership.use-case";
import { UpdateDealershipUseCase } from "./application/dealership/update-dealership-use-case/update-dealership.use-case";
import { DealershipRepository } from "./domain/repositories/dealership.repository";
import { DealershipTeamController } from "./infrastructure/http-api/v1/dealership-team/dealership-team.controller";
import { CreateDealershipController } from "./infrastructure/http-api/v1/create-dealership/create-dealership.controller";
import { CreateMyDealershipController } from "./infrastructure/http-api/v1/create-my-dealership/create-my-dealership.controller";
import { FindAllDealershipsController } from "./infrastructure/http-api/v1/find-all-dealerships/find-all-dealerships.controller";
import { FindDealershipController } from "./infrastructure/http-api/v1/find-one-dealership/find-one-dealership.controller";
import { FindDealershipBySlugController } from "./infrastructure/http-api/v1/find-one-dealership-by-slug/find-one-dealership-by-slug.controller";
import { RemoveDealershipController } from "./infrastructure/http-api/v1/remove-dealership/remove-dealership.controller";
import { UpdateDealershipController } from "./infrastructure/http-api/v1/update-dealership/update-dealership.controller";
import { DealershipEntity } from "./infrastructure/persistence/dealership.entity";
import { TypeOrmDealershipRepository } from "./infrastructure/repositories/typeorm.dealership-repository";
import { DealershipInvitationModule } from "./modules/dealership-invitation.module";
import { DealershipReviewsModule } from "./modules/dealership-reviews.module";
import { RemoveFilesUseCase } from "../shared/file/application/images-use-cases/remove-files-use-case/remove-files.use-case";
import { MinioService } from "../shared/minio-provider/minio.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([DealershipEntity]),
    DealershipInvitationModule,
    forwardRef(() => ProfileModule),
    forwardRef(() => DealershipReviewsModule),
  ],
  controllers: [
    CreateDealershipController,
    CreateMyDealershipController,
    FindAllDealershipsController,
    FindDealershipBySlugController,
    FindDealershipController,
    DealershipTeamController,
    UpdateDealershipController,
    RemoveDealershipController,
  ],
  providers: [
    SyncDealershipMembersUseCase,
    FindDealershipTeamUseCase,
    UpdateDealershipMemberRoleUseCase,
    RemoveDealershipMemberUseCase,
    LeaveDealershipTeamUseCase,
    CreateDealershipUseCase,
    CreateMyDealershipUseCase,
    FindAllDealershipUseCase,
    FindOneDealershipBySlugUseCase,
    FindOneDealershipUseCase,
    UpdateDealershipUseCase,
    RemoveDealershipUseCase,
    RemoveFilesUseCase,
    MinioService,
    RecalculateDealershipRatingService,
    TypeOrmDealershipRepository,
    {
      provide: DealershipRepository,
      useExisting: TypeOrmDealershipRepository,
    },
  ],
  exports: [DealershipRepository, RecalculateDealershipRatingService, DealershipInvitationModule],
})
export class DealershipModule {}
