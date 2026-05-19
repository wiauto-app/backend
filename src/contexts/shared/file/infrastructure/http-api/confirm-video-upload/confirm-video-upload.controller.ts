import { Body, Controller, Post, UseGuards } from "@nestjs/common";

import { ConfirmVideoUploadUseCase } from "../../../application/videos-use-cases/confirm-video-upload-use-case/confirm-video-upload.use-case";
import { CONFIRM_VIDEO_UPLOAD } from "../../media.constants";
import { ConfirmVideoUploadHttpDto } from "./confirm-video-upload.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(CONFIRM_VIDEO_UPLOAD)
export class ConfirmVideoUploadController {
  constructor(
    private readonly confirmVideoUploadUseCase: ConfirmVideoUploadUseCase
  ) { }

  @Post()
  run(@Body() confirmVideoUploadDto: ConfirmVideoUploadHttpDto) {
    return this.confirmVideoUploadUseCase.execute(confirmVideoUploadDto);
  }
}