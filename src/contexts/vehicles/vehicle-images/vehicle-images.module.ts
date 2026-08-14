import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BillingModule } from "@/src/contexts/billing/billing.module";
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

@Module({
  controllers: [
    BulkVehicleImagesController,
    RemoveVehicleImageController,
  ],

  providers: [
    CreateVehicleImageService,
    RemoveVehicleImageService,
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

    TypeOrmModule.forFeature([
      VehicleEntity,
      VehicleImagesEntity,
    ]),

    forwardRef(() => VehiclesModule),
    forwardRef(() => BillingModule),
  ],
})
export class VehicleImagesModule {}