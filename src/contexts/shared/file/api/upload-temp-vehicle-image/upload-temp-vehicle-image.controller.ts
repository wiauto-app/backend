import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

import { TEN_MB, UPLOAD_TEMP_VEHICLE_IMAGE } from "../../media.constants";
import { ImageValidationPipe } from "../../pipes/image-validation.pipe";
import { UploadTempVehicleImageService } from "../../services/upload-temp-vehicle-image.service";

@UseGuards(JwtGuard)
@Controller(UPLOAD_TEMP_VEHICLE_IMAGE)
export class UploadTempVehicleImageController {
  constructor(
    private readonly uploadTempVehicleImageService: UploadTempVehicleImageService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: TEN_MB } }))
  @UsePipes(ImageValidationPipe)
  run(@UploadedFile() file: Express.Multer.File) {
    return this.uploadTempVehicleImageService.execute(file);
  }
}
