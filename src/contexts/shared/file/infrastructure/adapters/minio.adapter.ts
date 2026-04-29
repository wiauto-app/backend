import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";
import { envs } from "@/src/common/envs";
import { firstValueFrom } from "rxjs";

import { ContentType, FileStoragePort } from "../../domain/ports/file-storage.port";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";

@Injectable()
export class MinioAdapter extends FileStoragePort {
  constructor(private readonly minioService: MinioService) {
    super();
  }

  async uploadFiles(files: Express.Multer.File[], storagePath: string): Promise<string[]> {
    const base = storagePath.replace(/\/$/, "");
    const paths: string[] = [];

    for (const file of files) {
      const safe_name = normalize_image_filename_for_storage(
        file.originalname,
        file.mimetype,
      );
      const key = `${base}/${safe_name}`;
      const body = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as Uint8Array);
      const url = await firstValueFrom(
        this.minioService.uploadFile(body, key, file.mimetype),
      );
      const path = new URL(url).pathname;
      paths.push(path);
    }

    return paths;
  }

  async deleteFiles(urls: string[]): Promise<void> {
    if (urls.length === 0) {
      return;
    }

    await Promise.all(
      urls.map((url) => firstValueFrom(this.minioService.deleteFileByUrl(url))),
    );
  }

  async generateSignedUrl(bucketName: string, fileKey: string, contentType: string): Promise<string> {
    return await this.minioService.generateUploadUrl(bucketName, fileKey, contentType);
  }

  async downloadFile(fileKey: string): Promise<Buffer | null> {
    const url = await firstValueFrom(this.minioService.getPublicUrl(fileKey));
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }

  async downloadVideoFile(file_key: string): Promise<Buffer | null> {
    return this.minioService.getObjectBuffer(envs.MINIO_VIDEO_BUCKET_NAME, file_key);
  }

  async replaceVideoObject(
    file_key: string,
    body: Buffer,
    content_type: ContentType,
  ): Promise<void> {
    await this.minioService.putObjectToBucket(
      envs.MINIO_VIDEO_BUCKET_NAME,
      file_key,
      body,
      content_type,
    );
  }

  async deleteVideoObject(file_key: string): Promise<void> {
    await this.minioService.deleteObjectFromBucket(
      envs.MINIO_VIDEO_BUCKET_NAME,
      file_key,
    );
  }

}
