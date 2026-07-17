import { Module } from "@nestjs/common";

import { AttachVehicleImagesFromTempService } from "./services/attach-vehicle-images-from-temp.service";
import { BulkVehicleImagesService } from "./services/bulk-vehicle-images.service";
import { CreateVehicleImageService } from "./services/create-vehicle-image.service";
import { FileModule } from "../../shared/file/file.module";
import { BulkVehicleImagesController } from "./api/v1/bulk-vehicle-images/bulk-vehicle-images.controller";
import { CreateVehicleImageController } from "./api/v1/create-vehicle-image/create-vehicle-image.controller";
import { UploadFileInterceptor } from "./api/interceptors/uploadFile.interceptor";
import { VehicleImagesPersistenceModule } from "./vehicle-images-persistence.module";

@Module({
  controllers: [CreateVehicleImageController, BulkVehicleImagesController],
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
  imports: [VehicleImagesPersistenceModule, FileModule],
})
export class VehicleImagesModule {}
