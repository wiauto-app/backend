import { Body, Controller, Post, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";

import { CreateVehicleUseCase } from "@/src/contexts/vehicles/application/create-vehicle-use-case/create-vehicle.use-case";
import { ImageValidationPipe } from "@/src/contexts/shared/file/infrastructure/pipes/image-validation.pipe";

import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleHttpDto } from "./create-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class CreateVehicleController {
  constructor(private readonly createVehicleUseCase: CreateVehicleUseCase) {}

  @Post()
  @UseInterceptors(FilesInterceptor("files"))
  run(
    @Body() createVehicleHttpDto: CreateVehicleHttpDto,
    @UploadedFiles(ImageValidationPipe) files: Express.Multer.File[],
  ) {
    return this.createVehicleUseCase.execute(createVehicleHttpDto, files);
  }
}
