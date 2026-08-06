import { GenerateFileSignedUrlHttpDto } from "../api/generate-file-signed-url/generate-file-signed-url.http-dto";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { UploadFileService } from "./upload-file.service";
import { UploadVideoService } from "./upload-video.service";

@Injectable()
export class GenerateSignedUrlService {
  constructor(
    private readonly uploadFileService: UploadFileService,
    private readonly uploadVideoService: UploadVideoService,
  ) {}

  async execute(
    generateFileSignedUrlHttpDto: GenerateFileSignedUrlHttpDto,
  ): Promise<{ signed_url: string }> {
    const fileKey = generateFileSignedUrlHttpDto.file_key.replace(/^\/+/, "");
    const isVideo = generateFileSignedUrlHttpDto.content_type.startsWith("video/");

    if (isVideo) {
      const result = await this.uploadVideoService.createUploadUrl({
        mode: "presigned",
        directory: generateFileSignedUrlHttpDto.bucket_name,
        fileKey,
        contentType: generateFileSignedUrlHttpDto.content_type,
      });
      return { signed_url: result.signed_url };
    }

    const result = await this.uploadFileService.createUploadUrl({
      mode: "presigned",
      directory: generateFileSignedUrlHttpDto.bucket_name,
      fileKey,
      contentType: generateFileSignedUrlHttpDto.content_type,
    });
    return { signed_url: result.signed_url };
  }
}
