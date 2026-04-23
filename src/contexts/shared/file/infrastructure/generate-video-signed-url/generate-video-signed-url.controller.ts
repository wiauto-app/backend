import { Body, Controller, Post } from "@nestjs/common";
import { GENERATE_VIDEO_SIGNED_URL } from "../media.constants";
import { GenerateSignedUrlUseCase } from "../../application/videos-use-cases/generate-signed-url-use-case/generate-signed-url.use-case";
import { GenerateVideoSignedUrlHttpDto } from "./generate-video-signed-url.http-dto";


@Controller(GENERATE_VIDEO_SIGNED_URL)
export class GenerateVideoSignedUrlController {
  constructor(
    private readonly generateSignedUrlUseCase: GenerateSignedUrlUseCase
  ) { }

  @Post()
  run(@Body() generateVideoSignedUrlHttpDto: GenerateVideoSignedUrlHttpDto) {
    return this.generateSignedUrlUseCase.execute(generateVideoSignedUrlHttpDto);
  }
}