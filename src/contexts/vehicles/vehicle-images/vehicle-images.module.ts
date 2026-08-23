import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { BullModule } from "@nestjs/bullmq";

import { BillingModule } from "@/src/contexts/billing/billing.module";
import { PROCESS_VEHICLE_IMAGE_QUEUE } from "@/src/contexts/shared/file/media.constants";
import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { VehiclesModule } from "../vehicles.module";

import { AttachVehicleImagesFromTempService } from "./services/attach-vehicle-images-from-temp.service";
import { BulkVehicleImagesService } from "./services/bulk-vehicle-images.service";
import { CreateVehicleImageService } from "./services/create-vehicle-image.service";
import { FileModule } from "../../shared/file/file.module";
import { BulkVehicleImagesController } from "./api/v1/bulk-vehicle-images/bulk-vehicle-images.controller";
import { UploadFileInterceptor } from "./api/interceptors/uploadFile.interceptor";
import { VehicleImagesPersistenceModule } from "./vehicle-images-persistence.module";
import { VehicleImagesEntity } from "./entities/vehicle-images.entity";
import { RemoveVehicleImageController } from "./api/v1/remove-vehicle-image/remove-vehicle-image.controller";
import { RemoveVehicleImageService } from "./services/remove-vehicle-image.service";
import { TempUploadController } from "./api/v1/temp-upload/temp-upload.controller";
import { TempUploadService } from "./services/temp-upload.service";
import { TemporaryUploadEntity } from "../../shared/file/entities/temporary-upload.entity";

@Module({
  controllers: [
    BulkVehicleImagesController,
    RemoveVehicleImageController,
    TempUploadController,
  ],

  providers: [
    CreateVehicleImageService,
    RemoveVehicleImageService,
    BulkVehicleImagesService,
    AttachVehicleImagesFromTempService,
    UploadFileInterceptor,
    TempUploadService,
  ],

  exports: [
    CreateVehicleImageService,
    VehicleImagesPersistenceModule,
    BulkVehicleImagesService,
    AttachVehicleImagesFromTempService,
    TempUploadService,
  ],

  imports: [
    VehicleImagesPersistenceModule,
    FileModule,
    BullModule.registerQueue({ name: PROCESS_VEHICLE_IMAGE_QUEUE }),

    TypeOrmModule.forFeature([
      VehicleEntity,
      VehicleImagesEntity,
      TemporaryUploadEntity,
    ]),

    forwardRef(() => VehiclesModule),
    forwardRef(() => BillingModule),
  ],
})
export class VehicleImagesModule {}
