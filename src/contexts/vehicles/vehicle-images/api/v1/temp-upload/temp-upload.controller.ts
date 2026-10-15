import {
  Controller,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  ParseUUIDPipe,
} from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Request, Response } from "express";

import { envs } from "@/src/common/envs";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { TempUploadService } from "../../../services/temp-upload.service";
import {
  readGuestId,
  resolveGuestId,
} from "../../../guest/guest-upload-identity";
import {
  CreateTempUploadHttpDto,
  CreateTempUploadResponseDto,
} from "./create-temp-upload.http-dto";
import { ConfirmTempUploadResponseDto } from "./confirm-temp-upload.http-dto";

/**
 * Subidas temporales de fotos de vehículos. Admite invitados (sin sesión),
 * identificados por la cookie `wiauto_guest_id`; el throttle `guest-temp-upload`
 * se omite para usuarios autenticados (`skipIf` en AppModule).
 */
@Controller("v1/vehicle-images")
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@SkipThrottle({
  "vehicle-ai": true,
  "ai-search-filters": true,
  "support-tickets": true,
  "vehicle-identification": true,
  "guest-publish-ai": true,
  "guest-publish-lookup": true,
})
@Throttle({
  "guest-temp-upload": {
    limit: envs.GUEST_TEMP_UPLOAD_THROTTLE_LIMIT,
    ttl: envs.GUEST_TEMP_UPLOAD_THROTTLE_TTL_MS,
  },
})
export class TempUploadController {
  constructor(private readonly tempUploadService: TempUploadService) {}

  @Post("temp-upload")
  async createTempUpload(
    @Body() dto: CreateTempUploadHttpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<CreateTempUploadResponseDto> {
    const user = req.user;
    const owner = user
      ? { profileId: user.id, guestId: null }
      : { profileId: null, guestId: resolveGuestId(req, res) };

    return this.tempUploadService.createTempUpload(owner, dto);
  }

  @Post("temp-upload/:id/confirm")
  async confirmTempUpload(
    @Param("id", ParseUUIDPipe) uploadId: string,
    @Req() req: Request,
  ): Promise<ConfirmTempUploadResponseDto> {
    const profileId = req.user?.id ?? null;
    const guestId = readGuestId(req);
    if (!profileId && !guestId) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    return this.tempUploadService.confirmTempUpload(uploadId, {
      profileId,
      guestId,
    });
  }
}
