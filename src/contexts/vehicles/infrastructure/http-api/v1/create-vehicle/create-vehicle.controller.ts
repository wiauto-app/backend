import { CreateVehicleUseCase } from "@/src/contexts/vehicles/application/vehicle/create-vehicle-use-case/create-vehicle.use-case";
import { CreateVehicleAuth } from "@/src/contexts/vehicles/infrastructure/decorators/create-vehicle-auth.decorator";
import { ImageValidationPipe } from "@/src/contexts/shared/file/infrastructure/pipes/image-validation.pipe";
import {
  Body,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { Request } from "express";

import { V1_VEHICLES } from "../../route.constants";
import { CreateVehicleHttpDto } from "./create-vehicle.http-dto";

@Controller(V1_VEHICLES)
export class CreateVehicleController {
  constructor(private readonly createVehicleUseCase: CreateVehicleUseCase) {}

  @Post()
  @CreateVehicleAuth()
  @UseInterceptors(FilesInterceptor("files"))
  run(
    @Body() createVehicleHttpDto: CreateVehicleHttpDto,
    @UploadedFiles(ImageValidationPipe) files: Express.Multer.File[],
    @Req() req: Request,
  ) {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    return this.createVehicleUseCase.execute(
      createVehicleHttpDto,
      files,
      user.id,
    );
  }
}
