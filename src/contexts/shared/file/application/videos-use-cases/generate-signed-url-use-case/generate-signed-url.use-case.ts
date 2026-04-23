import { envs } from "@/src/common/envs";
import { FileStoragePort } from "../../../domain/ports/file-storage.port";
import { GenerateVideoSignedUrlHttpDto } from "../../../infrastructure/generate-video-signed-url/generate-video-signed-url.http-dto";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";


@Injectable()
export class GenerateSignedUrlUseCase {
  private readonly bucketName: string;
  private readonly path: string;
  constructor(
    private readonly fileStoragePort: FileStoragePort
  ) { 
    this.bucketName = envs.MINIO_VIDEO_BUCKET_NAME;
    this.path = "videos";
  }

  async execute( generateVideoSignedUrlHttpDto: GenerateVideoSignedUrlHttpDto ): Promise<string> {
    
    return await this.fileStoragePort.generateSignedUrl(this.bucketName, this.path + generateVideoSignedUrlHttpDto.file_key, generateVideoSignedUrlHttpDto.content_type);
  }
}