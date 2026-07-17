import { Controller, Get, Query } from "@nestjs/common";
import { GenerateReadFileSignedUrlDto } from "../../dto/generate-read-file-signed-url.dto";
import { GenerateReadFileSignedUrlService } from "../../services/generate-read-file-signed-url.service";
import { GENERATE_READ_FILE_SIGNED_URL } from "../../media.constants";


@Controller(GENERATE_READ_FILE_SIGNED_URL)
export class GenerateReadFileSignedUrlController {
  constructor(
    private readonly generateReadFileSignedUrlService: GenerateReadFileSignedUrlService
  ) {}

  @Get()
  run(@Query() generateReadFileSignedUrlDto: GenerateReadFileSignedUrlDto) {
    return this.generateReadFileSignedUrlService.execute(generateReadFileSignedUrlDto);
  }
}