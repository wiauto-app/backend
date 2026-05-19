import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FileStoragePort } from "../../../../domain/ports/file-storage.port";
import { GenerateReadFileSignedUrlDto } from "./generate-read-file-signed-url.dto";

@Injectable()
export class GenerateReadFileSignedUrlUseCase {
  constructor(
    private readonly fileStoragePort: FileStoragePort
  ) { }

  async execute(generateReadFileSignedUrlDto: GenerateReadFileSignedUrlDto): Promise<{ signed_url: string }> {
    return this.fileStoragePort.generateReadSignedUrl(generateReadFileSignedUrlDto.bucket_name, generateReadFileSignedUrlDto.file_key);
  }
}