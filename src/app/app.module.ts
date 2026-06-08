import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HealthModule } from "@/app/health/health.module";
import { UserModule } from "@/contexts/users/user.module";
import { LoggerModule } from "@/shared/logger/logger.module";

import { typeOrmConfig } from "../database/data-source";
import { AuthModule } from "../contexts/auth/auth.module";
import { ProfileModule } from "../contexts/profiles/profile.module";
import { VehiclesModule } from "../contexts/vehicles/vehicles.module";
import { ReviewsModule } from "../contexts/vehicles/modules/reviews.module";
import { LeadsModule } from "../contexts/vehicles/modules/leads.module";
import { SharesModule } from "../contexts/vehicles/modules/shares.module";
import { ViewsModule } from "../contexts/vehicles/modules/views.module";
import { VehicleListsModule } from "../contexts/vehicles/modules/vehicle-lists.module";
import { MailModule } from "../contexts/shared/mail/mail.module";
import { TwoFactorAuthModule } from "../contexts/2fa/2fa.module";
import { BullModule } from "@nestjs/bullmq";
import { envs } from "../common/envs";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { FileModule } from "../contexts/shared/file/file.module";
import { RolesModule } from "../contexts/roles/roles.module";
import { PermissionModule } from "../contexts/users/permissions/permission.module";
import { DealershipModule } from "../contexts/dealership/dealership.module";
import { DealershipReviewsModule } from "../contexts/dealership/modules/dealership-reviews.module";
import { ChatModule } from "../contexts/chat/modules/chat.module";
import { ReportCategoriesModule } from "../contexts/reports/modules/report-categories.module";
import { ReportsModule } from "../contexts/reports/modules/reports.module";
import { TicketCategoriesModule } from "../contexts/support/modules/ticket-categories.module";
import { TicketsModule } from "../contexts/support/modules/tickets.module";

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
    ReviewsModule,
    LeadsModule,
    SharesModule,
    ViewsModule,
    VehicleListsModule,
    MailModule,
    TwoFactorAuthModule,
    FileModule,
    RolesModule,
    PermissionModule,
    DealershipModule,
    DealershipReviewsModule,
    ChatModule,
    TicketCategoriesModule,
    TicketsModule,
    ReportCategoriesModule,
    ReportsModule,
    // ThrottlerModule.forRoot({
    //   throttlers: [
    //     {
    //       ttl: 60_000,
    //       limit: 200,
    //     },
    //   ],
    // }),
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
  // providers: [
  //   {
  //     provide: APP_GUARD,
  //     useClass: ThrottlerGuard
  //   }
  // ],
})
export class AppModule { }
