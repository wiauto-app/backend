import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "@/src/contexts/auth/auth.module";
import { VersionEntity } from "@/src/contexts/vehicles/catalog/versions/entities/version.entity";
import { VehicleTypeEntity } from "@/src/contexts/vehicles/entities/vehicle-type.entity";
import { RegistrationTrackingController } from "./api/registration-tracking.controller";
import { MetaCapiService } from "./services/meta-capi.service";
import { VehiclePublishMetaCapiService } from "./services/vehicle-publish-meta-capi.service";

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([VersionEntity, VehicleTypeEntity]),
  ],
  controllers: [RegistrationTrackingController],
  providers: [MetaCapiService, VehiclePublishMetaCapiService],
  exports: [MetaCapiService, VehiclePublishMetaCapiService],
})
export class AnalyticsModule {}
