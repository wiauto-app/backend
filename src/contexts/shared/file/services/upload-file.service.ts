import path from "node:path";

import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

export type UploadFileMode = "presigned" | "buffer";

export type UploadFileNameStrategy =
  | "uuid"
  | "prefixTimestamp"
  | "originalSafe";

export interface UploadFileOptions {
  /** Directorio lógico dentro del único bucket R2. */
  directory: string;
  keyPrefix?: string;
  fileKey?: string;
  mode: UploadFileMode;
  contentType: string;
  allowedContentTypes?: string[];
  maxBytes?: number;
  fileNameStrategy?: UploadFileNameStrategy;
  fileNamePrefix?: string;
  originalFileName?: string;
  expiresInSec?: number;
  privateRead?: boolean;
  body?: Buffer;
}

export interface UploadFilePresignResult {
  signed_url: string;
  file_key: string;
}

export interface UploadFileBufferResult {
  path: string;
  file_key: string;
  read_url?: string;
}

@Injectable()
export class UploadFileService {
  constructor(private readonly objectStorageService: ObjectStorageService) {}

  async createUploadUrl(
    options: UploadFileOptions,
  ): Promise<UploadFilePresignResult> {
    if (options.mode !== "presigned") {
      throw new BadRequestException('createUploadUrl requiere mode "presigned"');
    }

    this.assertContentType(options);
    const fileKey = this.resolveFileKey(options);

    const signed_url = await this.objectStorageService.generateUploadUrl(
      options.directory,
      fileKey,
      options.contentType,
      options.expiresInSec,
    );

    return { signed_url, file_key: fileKey };
  }

  async uploadBuffer(
    options: UploadFileOptions,
    body?: Buffer,
  ): Promise<UploadFileBufferResult> {
    if (options.mode !== "buffer") {
      throw new BadRequestException('uploadBuffer requiere mode "buffer"');
    }

    const buffer = body ?? options.body;
    if (!buffer?.length) {
      throw new BadRequestException("Debes enviar el buffer del archivo");
    }

    if (options.maxBytes != null && buffer.length > options.maxBytes) {
      throw new BadRequestException(
        `El archivo supera el tamaño máximo de ${options.maxBytes} bytes`,
      );
    }

    this.assertContentType(options);
    const fileKey = this.resolveFileKey(options);

    await this.objectStorageService.putObjectToBucket(
      options.directory,
      fileKey,
      buffer,
      options.contentType,
    );

    const result: UploadFileBufferResult = {
      path: `${options.directory}/${fileKey}`,
      file_key: fileKey,
    };

    if (options.privateRead) {
      result.read_url = await this.objectStorageService.generateReadUrl(
        options.directory,
        fileKey,
        options.expiresInSec,
      );
    }

    return result;
  }

  private assertContentType(options: UploadFileOptions): void {
    if (!options.allowedContentTypes?.length) {
      return;
    }
    if (!options.allowedContentTypes.includes(options.contentType)) {
      throw new BadRequestException(
        `Tipo de contenido no permitido: ${options.contentType}`,
      );
    }
  }

  private resolveFileKey(options: UploadFileOptions): string {
    if (options.fileKey?.trim()) {
      return options.fileKey.replace(/^\/+/, "");
    }

    const prefix = (options.keyPrefix ?? "files").replace(/^\/+|\/+$/g, "");
    const strategy = options.fileNameStrategy ?? "uuid";
    const original = options.originalFileName?.trim() || "file";
    const ext = path.extname(original) || "";

    if (strategy === "uuid") {
      return `${prefix}/${uuidv4()}${ext}`;
    }

    const safeBase = path.basename(original).replace(/^\./, "") || "file";

    if (strategy === "originalSafe") {
      return `${prefix}/${safeBase}`;
    }

    const namePrefix = options.fileNamePrefix?.trim() || "file";
    return `${prefix}/${namePrefix}-${Date.now()}-${safeBase}`;
  }
}
