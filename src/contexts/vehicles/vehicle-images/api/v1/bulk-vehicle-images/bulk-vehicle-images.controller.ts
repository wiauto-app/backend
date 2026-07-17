import { Controller, Param, ParseUUIDPipe, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";

import { V1_VEHICLE_IMAGES_BULK } from "../../route.constants";
import { BulkVehicleImagesService } from "../../../services/bulk-vehicle-images.service";
@Controller(V1_VEHICLE_IMAGES_BULK)
export class BulkVehicleImagesController {

  constructor(
    private readonly bulkVehicleImagesService: BulkVehicleImagesService
  ) { }

  @Post("/:vehicle_id")
  @UseInterceptors(FilesInterceptor("files"))
  run(@UploadedFiles() files: Express.Multer.File[], @Param("vehicle_id", ParseUUIDPipe) vehicle_id: string) {
    return this.bulkVehicleImagesService.execute({ vehicle_id, files });
  }
}