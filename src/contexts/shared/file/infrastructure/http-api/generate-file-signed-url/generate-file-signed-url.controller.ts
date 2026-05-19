import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { GENERATE_FILE_SIGNED_URL } from "../../media.constants";
import { GenerateSignedUrlUseCase } from "../../../application/videos-use-cases/generate-signed-url-use-case/generate-signed-url.use-case";
import { GenerateFileSignedUrlHttpDto } from "./generate-file-signed-url.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(GENERATE_FILE_SIGNED_URL)
export class GenerateFileSignedUrlController {
  constructor(
    private readonly generateSignedUrlUseCase: GenerateSignedUrlUseCase
  ) { }

  @Post()
  run(@Body() generateFileSignedUrlHttpDto: GenerateFileSignedUrlHttpDto): Promise<{ signed_url: string }> {
    return this.generateSignedUrlUseCase.execute(generateFileSignedUrlHttpDto);
  }
}