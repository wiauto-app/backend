import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProfileEntity } from "@/src/contexts/profiles/entities/profile.entity";
import { User } from "@/src/contexts/users/entities/user.entity";

import { MakeEntity } from "../catalog/makes/entities/make.entity";
import { CatalogModelEntity } from "../catalog/models/entities/catalog-model.entity";
import { CatalogYearEntity } from "../catalog/years/entities/catalog-year.entity";
import { VersionEntity } from "../catalog/versions/entities/version.entity";
import { ReverseGeocodingPort } from "../ports/reverse-geocoding.port";
import { GoogleReverseGeocodingService } from "../services/google-reverse-geocoding.service";
import { PostgisLocationResolver } from "../services/postgis-location.resolver";
import { ReverseGeocodingService } from "../services/reverse-geocoding.service";

import { CreateAppraisalRequestController } from "./api/public/create-appraisal-request/create-appraisal-request.controller";
import { CreateAuthenticatedAppraisalRequestController } from "./api/authenticated/create-authenticated-appraisal-request/create-authenticated-appraisal-request.controller";
import { AppraisalRequestsAdminController } from "./api/admin/appraisal-requests-admin.controller";
import { AppraisalRequestEntity } from "./entities/appraisal-request.entity";
import { TypeOrmAppraisalRequestRepository } from "./repositories/typeorm.appraisal-request-repository";
import { AppraisalRequestNotificationMailService } from "./services/appraisal-request-notification-mail.service";
import { AppraisalRequestsService } from "./services/appraisal-requests.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppraisalRequestEntity,
      MakeEntity,
      CatalogModelEntity,
      CatalogYearEntity,
      VersionEntity,
      ProfileEntity,
      User,
    ]),
  ],
  controllers: [
    CreateAppraisalRequestController,
    CreateAuthenticatedAppraisalRequestController,
    AppraisalRequestsAdminController,
  ],
  providers: [
    AppraisalRequestsService,
    AppraisalRequestNotificationMailService,
    TypeOrmAppraisalRequestRepository,
    GoogleReverseGeocodingService,
    PostgisLocationResolver,
    ReverseGeocodingService,
    {
      provide: ReverseGeocodingPort,
      useExisting: ReverseGeocodingService,
    },
  ],
})
export class AppraisalRequestsModule {}
