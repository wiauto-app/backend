import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { User } from "@/src/contexts/users/entities/user.entity";
import { VideoUploadService } from "../../../services/video-upload.service";
import {
  CompleteVideoUploadHttpDto,
  CompleteVideoUploadResponseDto,
  InitVideoUploadHttpDto,
  InitVideoUploadResponseDto,
  VideoPartUrlsHttpDto,
  VideoPartUrlsResponseDto,
  VideoUploadedPartsResponseDto,
} from "./video-upload.http-dto";

type AuthenticatedRequest = Request & { user?: User };

const requireUser = (req: AuthenticatedRequest): User => {
  if (!req.user) {
    throw new UnauthorizedException("Usuario no autenticado");
  }
  return req.user;
};

/**
 * Subida multipart directa a R2 de vídeos de vehículos. Solo usuarios con
 * entitlement `videos_per_vehicle` (los admins no se limitan). El vídeo nunca
 * atraviesa la API: aquí solo se firman partes y se valida el resultado.
 */
@Controller("v1/vehicle-videos/uploads")
@UseGuards(JwtGuard)
export class VideoUploadController {
  constructor(private readonly video_upload_service: VideoUploadService) {}

  @Post()
  init(
    @Body() dto: InitVideoUploadHttpDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InitVideoUploadResponseDto> {
    const user = requireUser(req);
    return this.video_upload_service.initUpload(
      { profile_id: user.id, is_admin: Boolean(user.is_admin) },
      dto,
    );
  }

  @Post(":id/part-urls")
  @HttpCode(HttpStatus.OK)
  partUrls(
    @Param("id", ParseUUIDPipe) upload_id: string,
    @Body() dto: VideoPartUrlsHttpDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<VideoPartUrlsResponseDto> {
    return this.video_upload_service.getPartUrls(
      upload_id,
      requireUser(req).id,
      dto.part_numbers,
    );
  }

  @Get(":id/parts")
  parts(
    @Param("id", ParseUUIDPipe) upload_id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<VideoUploadedPartsResponseDto> {
    return this.video_upload_service.listUploadedParts(
      upload_id,
      requireUser(req).id,
    );
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  complete(
    @Param("id", ParseUUIDPipe) upload_id: string,
    @Body() dto: CompleteVideoUploadHttpDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CompleteVideoUploadResponseDto> {
    return this.video_upload_service.completeUpload(
      upload_id,
      requireUser(req).id,
      dto,
    );
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async abort(
    @Param("id", ParseUUIDPipe) upload_id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.video_upload_service.abortUpload(upload_id, requireUser(req).id);
  }
}
