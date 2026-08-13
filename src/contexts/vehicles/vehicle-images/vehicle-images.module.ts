import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BillingModule } from "@/src/contexts/billing/billing.module";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";

import { AttachVehicleImagesFromTempService } from "./services/attach-vehicle-images-from-temp.service";
import { BulkVehicleImagesService } from "./services/bulk-vehicle-images.service";
import { CreateVehicleImageService } from "./services/create-vehicle-image.service";
import { FileModule } from "../../shared/file/file.module";
import { BulkVehicleImagesController } from "./api/v1/bulk-vehicle-images/bulk-vehicle-images.controller";
import { UploadFileInterceptor } from "./api/interceptors/uploadFile.interceptor";
import { VehicleImagesPersistenceModule } from "./vehicle-images-persistence.module";

@Module({
  controllers: [BulkVehicleImagesController],
  providers: [
    CreateVehicleImageService,
    BulkVehicleImagesService,
    AttachVehicleImagesFromTempService,
    UploadFileInterceptor,
  ],
  exports: [
    CreateVehicleImageService,
    VehicleImagesPersistenceModule,
    BulkVehicleImagesService,
    AttachVehicleImagesFromTempService,
  ],
  imports: [
    VehicleImagesPersistenceModule,
    FileModule,
    TypeOrmModule.forFeature([VehicleEntity]),
    forwardRef(() => BillingModule),
  ],
})
export class VehicleImagesModule {}
