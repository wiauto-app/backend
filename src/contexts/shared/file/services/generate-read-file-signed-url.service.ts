import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FileStoragePort } from "../ports/file-storage.port";
import { GenerateReadFileSignedUrlDto } from "../dto/generate-read-file-signed-url.dto";

@Injectable()
export class GenerateReadFileSignedUrlService {
  constructor(
    private readonly fileStoragePort: FileStoragePort
  ) { }

  async execute(generateReadFileSignedUrlDto: GenerateReadFileSignedUrlDto): Promise<{ signed_url: string }> {
    return this.fileStoragePort.generateReadSignedUrl(generateReadFileSignedUrlDto.bucket_name, generateReadFileSignedUrlDto.file_key);
  }
}