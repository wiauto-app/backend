import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

import { STORAGE_DIRECTORIES } from "../storage-directories";
import { ConfirmVideoUploadService } from "./confirm-video-upload.service";

export type UploadVideoMode = "presigned" | "buffer";

export interface UploadVideoOptions {
  /** Directorio lógico; por defecto vehicles-videos. */
  directory?: string;
  fileKey?: string;
  keyPrefix?: string;
  mode: UploadVideoMode;
  contentType: string;
  expiresInSec?: number;
  enqueueTranscode?: boolean;
  replaceExisting?: boolean;
  body?: Buffer;
}

export interface UploadVideoPresignResult {
  signed_url: string;
  file_key: string;
}

export interface UploadVideoBufferResult {
  file_key: string;
  file_key_en_storage?: string;
}

@Injectable()
export class UploadVideoService {
  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly confirmVideoUploadService: ConfirmVideoUploadService,
  ) {}

  async createUploadUrl(
    options: UploadVideoOptions,
  ): Promise<UploadVideoPresignResult> {
    if (options.mode !== "presigned") {
      throw new BadRequestException('createUploadUrl requiere mode "presigned"');
    }

    const directory = options.directory ?? STORAGE_DIRECTORIES.VEHICLES_VIDEOS;
    const fileKey = this.resolveFileKey(options);

    if (options.replaceExisting) {
      await this.objectStorageService.deleteObjectFromBucket(directory, fileKey);
    }

    const signed_url = await this.objectStorageService.generateUploadUrl(
      directory,
      fileKey,
      options.contentType,
      options.expiresInSec,
    );

    return { signed_url, file_key: fileKey };
  }

  async uploadBuffer(
    options: UploadVideoOptions,
    body?: Buffer,
  ): Promise<UploadVideoBufferResult> {
    if (options.mode !== "buffer") {
      throw new BadRequestException('uploadBuffer requiere mode "buffer"');
    }

    const buffer = body ?? options.body;
    if (!buffer?.length) {
      throw new BadRequestException("Debes enviar el buffer del vídeo");
    }

    const directory = options.directory ?? STORAGE_DIRECTORIES.VEHICLES_VIDEOS;
    const fileKey = this.resolveFileKey(options);

    if (options.replaceExisting) {
      await this.objectStorageService.deleteObjectFromBucket(directory, fileKey);
    }

    await this.objectStorageService.putObjectToBucket(
      directory,
      fileKey,
      buffer,
      options.contentType,
    );

    const result: UploadVideoBufferResult = { file_key: fileKey };

    if (options.enqueueTranscode) {
      const confirm = await this.confirmVideoUploadService.execute({
        file_key: fileKey,
      });
      result.file_key_en_storage = confirm.file_key_en_storage;
    }

    return result;
  }

  private resolveFileKey(options: UploadVideoOptions): string {
    if (options.fileKey?.trim()) {
      return options.fileKey.replace(/^\/+/, "");
    }

    const prefix = (options.keyPrefix ?? "videos").replace(/^\/+|\/+$/g, "");
    return `${prefix}/${uuidv4()}`;
  }
}
