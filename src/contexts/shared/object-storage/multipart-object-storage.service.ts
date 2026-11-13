import { createReadStream, createWriteStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListPartsCommand,
  PutObjectCommand,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { envs } from "@/src/common/envs";
import { Injectable } from "../dependency-injectable/injectable";
import { s3, s3ForPresign } from "./s3.client";

export interface UploadedPart {
  part_number: number;
  etag: string;
  size: number;
}

const httpStatusOf = (error: unknown): number | undefined =>
  (error as { $metadata?: { httpStatusCode?: number } }).$metadata
    ?.httpStatusCode;

const isNotFound = (error: unknown): boolean => {
  const name = (error as { name?: string }).name;
  return (
    httpStatusOf(error) === 404 ||
    name === "NotFound" ||
    name === "NoSuchKey" ||
    name === "NoSuchUpload"
  );
};

/**
 * Operaciones S3 por key completa sobre el bucket único de R2:
 * multipart (subida directa desde el cliente), HEAD y transferencias en streaming.
 * Nunca recibe keys del cliente: las construye el servicio que lo usa.
 */
@Injectable()
export class MultipartObjectStorageService {
  private get bucket(): string {
    return envs.R2_BUCKET_NAME;
  }

  async createMultipartUpload(
    key: string,
    content_type: string,
  ): Promise<string> {
    const result = await s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: content_type,
      }),
    );
    if (!result.UploadId) {
      throw new Error("R2 no devolvió UploadId");
    }
    return result.UploadId;
  }

  signUploadPart(
    key: string,
    upload_id: string,
    part_number: number,
    expires_in_s: number,
  ): Promise<string> {
    return getSignedUrl(
      // client-s3 y presigner con versiones distintas (igual que ObjectStorageService)
      s3ForPresign as never,
      new UploadPartCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: upload_id,
        PartNumber: part_number,
      }),
      { expiresIn: expires_in_s },
    );
  }

  /** Partes ya subidas (paginado). `null` si la sesión multipart ya no existe. */
  async listParts(
    key: string,
    upload_id: string,
  ): Promise<UploadedPart[] | null> {
    const parts: UploadedPart[] = [];
    let marker: string | undefined;
    try {
      do {
        const result = await s3.send(
          new ListPartsCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: upload_id,
            PartNumberMarker: marker,
          }),
        );
        for (const part of result.Parts ?? []) {
          if (part.PartNumber && part.ETag) {
            parts.push({
              part_number: part.PartNumber,
              etag: part.ETag,
              size: part.Size ?? 0,
            });
          }
        }
        marker = result.IsTruncated
          ? String(result.NextPartNumberMarker)
          : undefined;
      } while (marker);
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
    return parts.sort((a, b) => a.part_number - b.part_number);
  }

  async completeMultipartUpload(
    key: string,
    upload_id: string,
    parts: { part_number: number; etag: string }[],
  ): Promise<void> {
    await s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: key,
        UploadId: upload_id,
        MultipartUpload: {
          Parts: [...parts]
            .sort((a, b) => a.part_number - b.part_number)
            .map((part) => ({ PartNumber: part.part_number, ETag: part.etag })),
        },
      }),
    );
  }

  /** Idempotente: una sesión ya abortada o completada no es un error. */
  async abortMultipartUpload(key: string, upload_id: string): Promise<void> {
    try {
      await s3.send(
        new AbortMultipartUploadCommand({
          Bucket: this.bucket,
          Key: key,
          UploadId: upload_id,
        }),
      );
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  /** Tamaño del objeto o `null` si no existe. */
  async headObjectSize(key: string): Promise<number | null> {
    try {
      const result = await s3.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return result.ContentLength ?? 0;
    } catch (error) {
      if (isNotFound(error)) {
        return null;
      }
      throw error;
    }
  }

  signGetObject(key: string, expires_in_s: number): Promise<string> {
    return getSignedUrl(
      // client-s3 y presigner con versiones distintas (igual que ObjectStorageService)
      s3ForPresign as never,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: expires_in_s },
    );
  }

  async copyObject(source_key: string, dest_key: string): Promise<void> {
    const copy_source = `${this.bucket}/${source_key
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
    await s3.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: copy_source,
        Key: dest_key,
      }),
    );
  }

  /** Idempotente: borrar un objeto inexistente no es un error. */
  async deleteObject(key: string): Promise<void> {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
    }
  }

  /** Descarga en streaming a disco (no carga el vídeo en memoria). */
  async downloadToFile(key: string, file_path: string): Promise<void> {
    const result = await s3.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    if (!result.Body) {
      throw new Error(`Objeto vacío en ${key}`);
    }
    await pipeline(result.Body as Readable, createWriteStream(file_path));
  }

  /** Sube un fichero local en streaming. */
  async uploadFromFile(
    key: string,
    file_path: string,
    content_type: string,
    cache_control = "public, max-age=31536000, immutable",
  ): Promise<void> {
    const { size } = await stat(file_path);
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: createReadStream(file_path),
        ContentLength: size,
        ContentType: content_type,
        CacheControl: cache_control,
      }),
    );
  }
}
