import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { ConfirmVideoUploadService } from "../../services/confirm-video-upload.service";
import { CONFIRM_VIDEO_UPLOAD } from "../../media.constants";
import { ConfirmVideoUploadHttpDto } from "./confirm-video-upload.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(CONFIRM_VIDEO_UPLOAD)
export class ConfirmVideoUploadController {
  constructor(
    private readonly confirmVideoUploadService: ConfirmVideoUploadService
  ) { }

  @Post()
  run(@Body() confirmVideoUploadDto: ConfirmVideoUploadHttpDto) {
    return this.confirmVideoUploadService.execute(confirmVideoUploadDto);
  }
}