import { Body, Controller, Post } from "@nestjs/common";

import { ConfirmVideoUploadUseCase } from "../../application/videos-use-cases/confirm-video-upload-use-case/confirm-video-upload.use-case";
import { CONFIRM_VIDEO_UPLOAD } from "../media.constants";
import { ConfirmVideoUploadHttpDto } from "./confirm-video-upload.http-dto";

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