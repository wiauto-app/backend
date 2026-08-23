import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
  UnauthorizedException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { TempUploadService } from "../../../services/temp-upload.service";
import {
  CreateTempUploadHttpDto,
  CreateTempUploadResponseDto,
} from "./create-temp-upload.http-dto";
import { ConfirmTempUploadResponseDto } from "./confirm-temp-upload.http-dto";

@Controller("v1/vehicle-images")
export class TempUploadController {
  constructor(private readonly tempUploadService: TempUploadService) {}

  @Post("temp-upload")
  @UseGuards(JwtGuard)
  async createTempUpload(
    @Body() dto: CreateTempUploadHttpDto,
    @Req() req: Request,
  ): Promise<CreateTempUploadResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.tempUploadService.createTempUpload(user.id, dto);
  }

  @Post("temp-upload/:id/confirm")
  @UseGuards(JwtGuard)
  async confirmTempUpload(
    @Param("id", ParseUUIDPipe) uploadId: string,
    @Req() req: Request,
  ): Promise<ConfirmTempUploadResponseDto> {
    const user = req.user;
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.tempUploadService.confirmTempUpload(uploadId, user.id);
  }
}
