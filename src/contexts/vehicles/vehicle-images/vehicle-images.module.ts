import { Module } from "@nestjs/common";

import { AttachVehicleImagesFromTempUseCase } from "./application/attach-vehicle-images-from-temp-use-case/attach-vehicle-images-from-temp.use-case";
import { BulkVehicleImagesUseCase } from "./application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";
import { CreateVehicleImageUseCase } from "./application/create-vehicle-images-use-cases/create-vehicle-image.use-case";
import { FileModule } from "../../shared/file/file.module";
import { BulkVehicleImagesController } from "./infrastructure/http-api/v1/bulk-vehicle-images/bulk-vehicle-images.controller";
import { CreateVehicleImageController } from "./infrastructure/http-api/v1/create-vehicle-image/create-vehicle-image.controller";
import { UploadFileInterceptor } from "./infrastructure/http-api/interceptors/uploadFile.interceptor";
import { VehicleImagesPersistenceModule } from "./vehicle-images-persistence.module";

@Module({
  controllers: [CreateVehicleImageController, BulkVehicleImagesController],
  providers: [
    CreateVehicleImageUseCase,
    BulkVehicleImagesUseCase,
    AttachVehicleImagesFromTempUseCase,
    UploadFileInterceptor,
  ],
  exports: [
    CreateVehicleImageUseCase,
    VehicleImagesPersistenceModule,
    BulkVehicleImagesUseCase,
    AttachVehicleImagesFromTempUseCase,
  ],
  imports: [VehicleImagesPersistenceModule, FileModule],
})
export class VehicleImagesModule {}
