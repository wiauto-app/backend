import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { HealthModule } from "@/app/health/health.module";
import { UserModule } from "@/contexts/users/user.module";
import { LoggerModule } from "@/shared/logger/logger.module";
import * as admin from "firebase-admin";
import { typeOrmConfig } from "../database/data-source";
import { AuthModule } from "../contexts/auth/auth.module";
import { ProfileModule } from "../contexts/profiles/profile.module";
import { VehiclesModule } from "../contexts/vehicles/vehicles.module";
import { LeadsModule } from "../contexts/vehicles/modules/leads.module";
import { SharesModule } from "../contexts/vehicles/modules/shares.module";
import { ContactClicksModule } from "../contexts/vehicles/modules/contact-clicks.module";
import { ViewsModule } from "../contexts/vehicles/modules/views.module";
import { ImpressionsModule } from "../contexts/vehicles/modules/impressions.module";
import { VehicleListsModule } from "../contexts/vehicles/modules/vehicle-lists.module";
import { VehicleEngagementModule } from "../contexts/vehicles/vehicle-engagement/vehicle-engagement.module";
import { MailModule } from "../contexts/shared/mail/mail.module";
import { TwoFactorAuthModule } from "../contexts/2fa/2fa.module";
import { BullModule } from "@nestjs/bullmq";
import { envs } from "../common/envs";
import { ThrottlerModule } from "@nestjs/throttler";
import { FileModule } from "../contexts/shared/file/file.module";
import { DealershipModule } from "../contexts/dealership/dealership.module";
import { DealershipReviewsModule } from "../contexts/dealership/modules/dealership-reviews.module";
import { ChatModule } from "../contexts/chat/modules/chat.module";
import { ReportCategoriesModule } from "../contexts/reports/modules/report-categories.module";
import { ReportsModule } from "../contexts/reports/modules/reports.module";
import { TicketCategoriesModule } from "../contexts/support/modules/ticket-categories.module";
import { TicketsModule } from "../contexts/support/modules/tickets.module";
import { AlertsModule } from "../contexts/alerts/alerts.module";
import { LocationsModule } from "../contexts/locations/locations.module";
import { BillingModule } from "../contexts/billing/billing.module";
import { AssistantModule } from "../contexts/assistant/assistant.module";
import { FinancingModule } from "../contexts/financing/financing.module";
import { AppraisalRequestsModule } from "../contexts/vehicles/appraisal-requests/appraisal-requests.module";
import { AdminDashboardModule } from "../contexts/admin/dashboard/admin-dashboard.module";
import { NewsletterModule } from "../contexts/newsletter/newsletter.module";
import { StrapiWebhookModule } from "../contexts/strapi/strapi-webhook.module";
import { ProfileDevicesModule } from "../contexts/profile_devices/profile-devices.module";

@Module({
  imports: [
    TypeOrmModule.forRoot(typeOrmConfig),
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule,
    HealthModule,
    UserModule,
    AuthModule,
    ProfileModule,
    VehiclesModule,
    LeadsModule,
    SharesModule,
    ContactClicksModule,
    ViewsModule,
    ImpressionsModule,
    VehicleListsModule,
    VehicleEngagementModule,
    MailModule,
    TwoFactorAuthModule,
    FileModule,
    DealershipModule,
    DealershipReviewsModule,
    ChatModule,
    TicketCategoriesModule,
    TicketsModule,
    ReportCategoriesModule,
    ReportsModule,
    AlertsModule,
    LocationsModule,
    BillingModule,
    AssistantModule,
    FinancingModule,
    AppraisalRequestsModule,
    AdminDashboardModule,
    NewsletterModule,
    StrapiWebhookModule,
    ProfileDevicesModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "vehicle-ai",
          ttl: envs.VEHICLE_AI_THROTTLE_TTL_MS,
          limit: envs.VEHICLE_AI_THROTTLE_LIMIT,
        },
        {
          name: "ai-search-filters",
          ttl: envs.AI_SEARCH_FILTERS_THROTTLE_TTL_MS,
          limit: envs.AI_SEARCH_FILTERS_THROTTLE_LIMIT,
        },
        {
          name: "vehicle-identification",
          ttl: envs.VEHICLE_IDENTIFICATION_THROTTLE_TTL_MS,
          limit: envs.VEHICLE_IDENTIFICATION_THROTTLE_LIMIT,
        },
      ],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => {
        return {
          stores: [
            new KeyvRedis(envs.REDIS_URL),
          ],
        };
      },
    }),
    BullModule.forRoot({
      connection: {
        url: envs.REDIS_URL,
      },
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 1,
        attempts: 1,
      },
    }),
  ],
})
export class AppModule {

  constructor() {
    admin.initializeApp({
      credential: admin.cert({
        projectId: envs.FIREBASE_PROJECT_ID,
        clientEmail: envs.FIREBASE_CLIENT_EMAIL,
        privateKey: envs.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }
}
