import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { firstValueFrom } from "rxjs";

import { ContentType, FileStoragePort } from "../ports/file-storage.port";
import {
  resolveObjectKeyFromStored,
  STORAGE_DIRECTORIES,
} from "../storage-directories";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";

@Injectable()
export class R2StorageAdapter extends FileStoragePort {
  constructor(private readonly objectStorageService: ObjectStorageService) {
    super();
  }

  async uploadFiles(
    files: Express.Multer.File[],
    storagePath: string,
    directory: string,
  ): Promise<string[]> {
    const base = storagePath.replace(/\/$/, "");
    const paths: string[] = [];

    for (const file of files) {
      const safeName = normalize_image_filename_for_storage(
        file.originalname,
        file.mimetype,
      );
      const key = `${base}/${safeName}`;
      const body = Buffer.isBuffer(file.buffer)
        ? file.buffer
        : Buffer.from(file.buffer as Uint8Array);
      const url = await firstValueFrom(
        this.objectStorageService.uploadFile(body, key, file.mimetype, directory),
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
      urls.map((url) => firstValueFrom(this.objectStorageService.deleteFileByUrl(url))),
    );
  }

  async generateSignedUrl(
    directory: string,
    fileKey: string,
    contentType: string,
  ): Promise<string> {
    return await this.objectStorageService.generateUploadUrl(
      directory,
      fileKey,
      contentType,
    );
  }

  async downloadFile(storedPath: string): Promise<Buffer | null> {
    return this.objectStorageService.getObjectBufferByKey(
      resolveObjectKeyFromStored(storedPath),
    );
  }

  async downloadVideoFile(fileKey: string): Promise<Buffer | null> {
    return this.objectStorageService.getObjectBuffer(
      STORAGE_DIRECTORIES.VEHICLES_VIDEOS,
      fileKey,
    );
  }

  async replaceVideoObject(
    fileKey: string,
    body: Buffer,
    contentType: ContentType,
  ): Promise<void> {
    await this.objectStorageService.putObjectToBucket(
      STORAGE_DIRECTORIES.VEHICLES_VIDEOS,
      fileKey,
      body,
      contentType,
    );
  }

  async deleteVideoObject(fileKey: string): Promise<void> {
    await this.objectStorageService.deleteObjectFromBucket(
      STORAGE_DIRECTORIES.VEHICLES_VIDEOS,
      fileKey,
    );
  }

  async generateReadSignedUrl(
    directory: string,
    fileKey: string,
  ): Promise<{ signed_url: string }> {
    const signed_url = await this.objectStorageService.generateReadUrl(
      directory,
      fileKey,
    );
    return { signed_url };
  }
}
