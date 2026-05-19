import { FileStoragePort } from "../../../domain/ports/file-storage.port";
import { GenerateFileSignedUrlHttpDto } from "../../../infrastructure/http-api/generate-file-signed-url/generate-file-signed-url.http-dto";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";


@Injectable()
export class GenerateSignedUrlUseCase {
  constructor(
    private readonly fileStoragePort: FileStoragePort
  ) { 
  }

  async execute( generateVideoSignedUrlHttpDto: GenerateFileSignedUrlHttpDto ): Promise<{ signed_url: string }> {
    const file_key = generateVideoSignedUrlHttpDto.file_key.replace(/^\/+/, "");

    const signed_url = await this.fileStoragePort.generateSignedUrl(
      generateVideoSignedUrlHttpDto.bucket_name,
      file_key,
      generateVideoSignedUrlHttpDto.content_type,
    );
    return { signed_url };
  }
}