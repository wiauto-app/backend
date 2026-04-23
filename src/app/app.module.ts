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
import { MailModule } from "../contexts/shared/mail/mail.module";
import { TwoFactorAuthModule } from "../contexts/2fa/2fa.module";
import { BullModule } from "@nestjs/bullmq";
import { envs } from "../common/envs";
import { ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { FileModule } from "../contexts/shared/file/file.module";

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
    MailModule,
    TwoFactorAuthModule,
    FileModule,
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
