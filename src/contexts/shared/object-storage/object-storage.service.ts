import { Observable, from } from "rxjs";
import { map, catchError } from "rxjs/operators";
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { envs } from "@/src/common/envs";
import {
  resolveObjectKeyFromStored,
  toFullObjectKey,
} from "@/src/contexts/shared/file/storage-directories";
import { Injectable } from "../dependency-injectable/injectable";

import { s3, s3ForPresign } from "./s3.client";

@Injectable()
export class ObjectStorageService {
  private get bucketName(): string {
    return envs.R2_BUCKET_NAME;
  }


  /**
   * Sube un buffer bajo `directory/relativeKey` y devuelve la URL pública CDN.
   */
  uploadFile(
    file: Buffer,
    relativeKey: string,
    contentType: string,
    directory: string,
  ): Observable<string> {
    const objectKey = toFullObjectKey(directory, relativeKey);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      Body: file,
      ContentType: contentType,
    });

    return from(s3.send(command)).pipe(
      map(() => this.buildPublicUrl(objectKey)),
      catchError((error: Error) => {
        console.error("Error uploading file:", error);
        throw new Error(`Error uploading file: ${error.message}`);
      }),
    );
  }

  async getObjectBuffer(
    directory: string,
    relativeKey: string,
  ): Promise<Buffer | null> {
    return this.getObjectBufferByKey(toFullObjectKey(directory, relativeKey));
  }

  async getObjectBufferByKey(objectKey: string): Promise<Buffer | null> {
    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
      );
      if (!response.Body) {
        return null;
      }
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
      if (status === 404) {
        return null;
      }
      throw error;
    }
  }

  async putObjectToBucket(
    directory: string,
    relativeKey: string,
    body: Buffer,
    contentType: string,
  ): Promise<void> {
    const objectKey = toFullObjectKey(directory, relativeKey);
    await s3.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  /**
   * URL pública CDN: `{R2_PUBLIC_URL}/{directory}/{key}` (= key completa).
   */
  buildPublicUrl(directoryOrObjectKey: string, relativeKey?: string): string {
    const endpoint = envs.R2_PUBLIC_URL.replace(/\/$/, "");
    const objectKey =
      relativeKey != null
        ? toFullObjectKey(directoryOrObjectKey, relativeKey)
        : directoryOrObjectKey.replace(/^\//, "");
    return `${endpoint}/${objectKey}`;
  }

  getPublicUrl(relativeKey: string, directory: string): Observable<string> {
    return from(Promise.resolve(this.buildPublicUrl(directory, relativeKey))).pipe(
      map((url) => url),
      catchError((error: Error) => {
        throw new Error(`Error generating public URL: ${error.message}`);
      }),
    );
  }

  async deleteObjectFromBucket(
    directory: string,
    relativeKey: string,
  ): Promise<void> {
    await this.deleteObjectByKey(toFullObjectKey(directory, relativeKey));
  }

  async deleteObjectByKey(objectKey: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({ Bucket: this.bucketName, Key: objectKey }),
    );
  }

  async copyObjectInBucket(
    directory: string,
    sourceRelativeKey: string,
    destRelativeKey: string,
  ): Promise<void> {
    const sourceKey = toFullObjectKey(directory, sourceRelativeKey);
    const destKey = toFullObjectKey(directory, destRelativeKey);
    const copySource = `${this.bucketName}/${sourceKey
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/")}`;
    await s3.send(
      new CopyObjectCommand({
        Bucket: this.bucketName,
        CopySource: copySource,
        Key: destKey,
      }),
    );
  }

  deleteFile(relativeKey: string, directory: string): Observable<void> {
    const objectKey = toFullObjectKey(directory, relativeKey);
    return from(this.deleteObjectByKey(objectKey)).pipe(map(() => void 0));
  }

  deleteFiles(relativeKeys: string[], directory: string): Observable<void> {
    return from(
      Promise.all(
        relativeKeys.map((relativeKey) =>
          this.deleteFile(relativeKey, directory).toPromise(),
        ),
      ),
    ).pipe(
      map(() => void 0),
      catchError((error) => {
        throw new Error(
          `Error deleting files: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }),
    );
  }

  /**
   * Elimina objeto. Acepta URL pública o pathname `/directorio/clave/...`.
   */
  deleteFileByUrl(urlOrPath: string): Observable<void> {
    const objectKey = resolveObjectKeyFromStored(urlOrPath);
    return from(this.deleteObjectByKey(objectKey)).pipe(map(() => void 0));
  }

  /**
   * URL firmada para subida directa. El Host de la firma es el API S3 de R2
   * (`R2_S3_ENDPOINT`); el navegador hace PUT a esa host, no al CDN.
   */
  async generateUploadUrl(
    directory: string,
    fileKey: string,
    contentType: string,
    expiresInSec = 60 * 20,
  ): Promise<string> {
    const objectKey = toFullObjectKey(directory, fileKey);
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });
    return await getSignedUrl(s3ForPresign as never, command, {
      expiresIn: expiresInSec,
    });
  }

  async generateReadUrl(
    directory: string,
    fileKey: string,
    expiresInSec = 60 * 20,
  ): Promise<string> {
    const objectKey = toFullObjectKey(directory, fileKey);
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });
    return await getSignedUrl(s3ForPresign as never, command, {
      expiresIn: expiresInSec,
    });
  }
}
