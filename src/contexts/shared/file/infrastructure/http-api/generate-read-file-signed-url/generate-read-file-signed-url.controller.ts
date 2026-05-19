import { Controller, Get, Query } from "@nestjs/common";
import { GenerateReadFileSignedUrlDto } from "./generate-read-file-signed-url.dto";
import { GenerateReadFileSignedUrlUseCase } from "../../../application/files-use-cases/files-use-cases/files-use-cases/generate-read-file-signed-url.use-case";
import { GENERATE_READ_FILE_SIGNED_URL } from "../../media.constants";


@Controller(GENERATE_READ_FILE_SIGNED_URL)
export class GenerateReadFileSignedUrlController {
  constructor(
    private readonly generateReadFileSignedUrlUseCase: GenerateReadFileSignedUrlUseCase
  ) {}

  @Get()
  run(@Query() generateReadFileSignedUrlDto: GenerateReadFileSignedUrlDto) {
    return this.generateReadFileSignedUrlUseCase.execute(generateReadFileSignedUrlDto);
  }
}