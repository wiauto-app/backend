import {  Body, Controller, Param, Post, Req, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";

import { V1_VEHICLE_IMAGES } from "../../route.constants";
import { CreateVehicleImageService } from "../../../services/create-vehicle-image.service";
import { UploadFileInterceptor } from "../../interceptors/uploadFile.interceptor";
import { CreateVehicleImageHttpDto } from "./create-vehicle-image.http-dto";

@Controller(V1_VEHICLE_IMAGES)
export class CreateVehicleImageController{

  constructor(
    private readonly createVehicleImageService: CreateVehicleImageService
  ) { }

  @UseInterceptors(FileInterceptor("file"), UploadFileInterceptor)
  @Post("/:vehicle_id")
  run(
    @Req() req: Request,
    @Param("vehicle_id") vehicle_id: string
  )
  // : Promise<{ image: PrimitiveVehicleImage }> 
  {
    return this.createVehicleImageService.execute({
      url: req.uploaded_file,
      vehicle_id: vehicle_id
    });
  }
}