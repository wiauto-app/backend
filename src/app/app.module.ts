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
  ],
  
})
export class AppModule {}
