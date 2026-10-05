import { Module, forwardRef } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AlertsModule } from "@/src/contexts/alerts/alerts.module";
import { DealershipEntity } from "@/src/contexts/dealership/entities/dealership.entity";
import { DealershipMembersEntity } from "@/src/contexts/dealership/entities/dealership-members.entity";
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
import { VehiclesModule } from "../vehicles.module";

import { AppraisalRequestsAdminController } from "./api/admin/appraisal-requests-admin.controller";
import { AppraisalOffersActionsController } from "./api/appraisals/appraisal-offers-actions/appraisal-offers-actions.controller";
import { EstimateAppraisalController } from "./api/appraisals/estimate-appraisal/estimate-appraisal.controller";
import { MyAppraisalsController } from "./api/appraisals/my-appraisals/my-appraisals.controller";
import { CreateAuthenticatedAppraisalRequestController } from "./api/authenticated/create-authenticated-appraisal-request/create-authenticated-appraisal-request.controller";
import { AppraisalOpportunitiesController } from "./api/dealership/appraisal-opportunities/appraisal-opportunities.controller";
import { AppraisalOfferEntity } from "./entities/appraisal-offer.entity";
import { AppraisalRequestEntity } from "./entities/appraisal-request.entity";
import { AppraisalOffersBootstrapService } from "./queues/appraisal-offers-bootstrap.service";
import { AppraisalOffersProcessor } from "./queues/appraisal-offers.processor";
import { APPRAISAL_OFFERS_QUEUE } from "./queues/appraisal-offers.queue.constants";
import { TypeOrmAppraisalRequestRepository } from "./repositories/typeorm.appraisal-request-repository";
import { AppraisalEstimateService } from "./services/appraisal-estimate.service";
import { AppraisalExpirationService } from "./services/appraisal-expiration.service";
import { AppraisalNotificationService } from "./services/appraisal-notification.service";
import { AppraisalOpportunitiesService } from "./services/appraisal-opportunities.service";
import { AppraisalRequestNotificationMailService } from "./services/appraisal-request-notification-mail.service";
import { AppraisalRequestsService } from "./services/appraisal-requests.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AppraisalRequestEntity,
      AppraisalOfferEntity,
      MakeEntity,
      CatalogModelEntity,
      CatalogYearEntity,
      VersionEntity,
      ProfileEntity,
      User,
      DealershipEntity,
      DealershipMembersEntity,
    ]),
    BullModule.registerQueue({ name: APPRAISAL_OFFERS_QUEUE }),
    forwardRef(() => AlertsModule),
    forwardRef(() => VehiclesModule),
  ],
  controllers: [
    EstimateAppraisalController,
    MyAppraisalsController,
    AppraisalOffersActionsController,
    AppraisalOpportunitiesController,
    /** @deprecated Flujo manual previo a la tasación IA; se reemplaza por `POST v1/appraisals/estimate`. */
    CreateAuthenticatedAppraisalRequestController,
    AppraisalRequestsAdminController,
  ],
  providers: [
    AppraisalRequestsService,
    AppraisalRequestNotificationMailService,
    TypeOrmAppraisalRequestRepository,
    AppraisalEstimateService,
    AppraisalOpportunitiesService,
    AppraisalNotificationService,
    AppraisalExpirationService,
    AppraisalOffersProcessor,
    AppraisalOffersBootstrapService,
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
