import { Controller, Param, ParseUUIDPipe, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";

import { V1_VEHICLE_IMAGES_BULK } from "../../route.constants";
import { BulkVehicleImagesUseCase } from "../../../../application/bulk-vehicle-images-use-case/bulk-vehicle-images.use-case";
@Controller(V1_VEHICLE_IMAGES_BULK)
export class BulkVehicleImagesController {

  constructor(
    private readonly bulkVehicleImagesUseCase: BulkVehicleImagesUseCase
  ) { }

  @Post("/:vehicle_id")
  @UseInterceptors(FilesInterceptor("files"))
  run(@UploadedFiles() files: Express.Multer.File[], @Param("vehicle_id", ParseUUIDPipe) vehicle_id: string) {
    return this.bulkVehicleImagesUseCase.execute({ vehicle_id, files });
  }
}