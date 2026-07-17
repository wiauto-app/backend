import { FileStoragePort } from "../ports/file-storage.port";
import { GenerateFileSignedUrlHttpDto } from "../api/generate-file-signed-url/generate-file-signed-url.http-dto";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";


@Injectable()
export class GenerateSignedUrlService {
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