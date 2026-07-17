import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { GENERATE_FILE_SIGNED_URL } from "../../media.constants";
import { GenerateSignedUrlService } from "../../services/generate-signed-url.service";
import { GenerateFileSignedUrlHttpDto } from "./generate-file-signed-url.http-dto";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";

@UseGuards(JwtGuard)
@Controller(GENERATE_FILE_SIGNED_URL)
export class GenerateFileSignedUrlController {
  constructor(
    private readonly generateSignedUrlService: GenerateSignedUrlService
  ) { }

  @Post()
  run(@Body() generateFileSignedUrlHttpDto: GenerateFileSignedUrlHttpDto): Promise<{ signed_url: string }> {
    return this.generateSignedUrlService.execute(generateFileSignedUrlHttpDto);
  }
}