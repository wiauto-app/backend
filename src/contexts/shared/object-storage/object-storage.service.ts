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
   * Sube un buffer bajo `directory/relativeKey`
   * y devuelve la URL pública CDN.
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

  async deleteByPath(path: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: path,
      })
    )
  }

  /**
   * Obtiene un objeto como Buffer.
   */
  async getObjectBuffer(
    directory: string,
    relativeKey: string,
  ): Promise<Buffer | null> {
    return this.getObjectBufferByKey(
      toFullObjectKey(directory, relativeKey),
    );
  }

  /**
   * Obtiene un objeto directamente mediante su object key completa.
   *
   * Ejemplo:
   * vehicles-images/vehicle-gallery/file.webp
   */
  async getObjectBufferByKey(
    objectKey: string,
  ): Promise<Buffer | null> {
    const normalizedObjectKey = this.normalizeObjectKey(objectKey);

    try {
      const response = await s3.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: normalizedObjectKey,
        }),
      );

      if (!response.Body) {
        return null;
      }

      return Buffer.from(
        await response.Body.transformToByteArray(),
      );
    } catch (error) {
      const status = (
        error as {
          $metadata?: {
            httpStatusCode?: number;
          };
        }
      ).$metadata?.httpStatusCode;

      if (status === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Guarda un objeto bajo `directory/relativeKey`.
   */
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
   * Construye la URL pública CDN.
   *
   * Puede recibir:
   *
   * buildPublicUrl("vehicles-images/vehicle-gallery/file.webp")
   *
   * o:
   *
   * buildPublicUrl("vehicles-images", "vehicle-gallery/file.webp")
   */
  buildPublicUrl(
    directoryOrObjectKey: string,
    relativeKey?: string,
  ): string {
    const endpoint = envs.R2_PUBLIC_URL.replace(/\/$/, "");

    const objectKey =
      relativeKey != null
        ? toFullObjectKey(directoryOrObjectKey, relativeKey)
        : this.normalizeObjectKey(directoryOrObjectKey);

    return `${endpoint}/${objectKey}`;
  }

  /**
   * Genera una URL pública CDN.
   */
  getPublicUrl(
    relativeKey: string,
    directory: string,
  ): Observable<string> {
    return from(
      Promise.resolve(
        this.buildPublicUrl(directory, relativeKey),
      ),
    ).pipe(
      map((url) => url),
      catchError((error: Error) => {
        throw new Error(
          `Error generating public URL: ${error.message}`,
        );
      }),
    );
  }

  /**
   * Elimina un objeto usando `directory + relativeKey`.
   */
  async deleteObjectFromBucket(
    directory: string,
    relativeKey: string,
  ): Promise<void> {
    await this.deleteObjectByKey(
      toFullObjectKey(directory, relativeKey),
    );
  }

  /**
   * Elimina directamente mediante la object key completa.
   *
   * IMPORTANTE:
   *
   * El bucket real es `envs.R2_BUCKET_NAME`.
   *
   * Ejemplo de object key:
   *
   * vehicles-images/vehicle-gallery/file.webp
   */
  async deleteObjectByKey(
    objectKey: string,
  ): Promise<void> {
    const normalizedObjectKey =
      this.normalizeObjectKey(objectKey);

   

    await s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: normalizedObjectKey,
      }),
    );
  }

  /**
   * Copia un objeto dentro del mismo bucket.
   */
  async copyObjectInBucket(
    directory: string,
    sourceRelativeKey: string,
    destRelativeKey: string,
  ): Promise<void> {
    const sourceKey = toFullObjectKey(
      directory,
      sourceRelativeKey,
    );

    const destKey = toFullObjectKey(
      directory,
      destRelativeKey,
    );

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

  /**
   * Elimina un archivo usando `directory + relativeKey`.
   */
  deleteFile(
    relativeKey: string,
    directory: string,
  ): Observable<void> {

    const objectKey = toFullObjectKey(
      directory,
      relativeKey,
    );

    return from(
      this.deleteObjectByKey(objectKey),
    ).pipe(
      map(() => void 0),
    );
  }

  /**
   * Elimina múltiples archivos.
   */
  deleteFiles(
    relativeKeys: string[],
    directory: string,
  ): Observable<void> {
    return from(
      Promise.all(
        relativeKeys.map((relativeKey) =>
          this.deleteFile(
            relativeKey,
            directory,
          ).toPromise(),
        ),
      ),
    ).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error(
          "Error deleting files:",
          error,
        );

        throw new Error(
          `Error deleting files: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }),
    );
  }

  /**
   * Elimina un objeto a partir de una URL pública,
   * pathname o object key almacenada.
   *
   * Ejemplos válidos:
   *
   * /vehicles-images/vehicle-gallery/file.webp
   *
   * vehicles-images/vehicle-gallery/file.webp
   *
   * https://cdn.example.com/vehicles-images/vehicle-gallery/file.webp
   */
  deleteFileByUrl(
    urlOrPath: string,
  ): Observable<void> {
    const objectKey =
      this.normalizeStoredObjectKey(urlOrPath);

    console.log("deleteFileByUrl:", {
      input: urlOrPath,
      bucket: this.bucketName,
      objectKey,
    });

    return from(
      this.deleteObjectByKey(objectKey),
    ).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error(
          "Error deleting file by URL:",
          error,
        );

        throw new Error(
          `Error deleting file: ${
            error instanceof Error
              ? error.message
              : String(error)
          }`,
        );
      }),
    );
  }

  /**
   * Genera una URL firmada para subida directa.
   *
   * El navegador hace PUT contra el endpoint S3 de R2.
   */
  async generateUploadUrl(
    directory: string,
    fileKey: string,
    contentType: string,
    expiresInSec = 60 * 20,
  ): Promise<string> {
    const objectKey = toFullObjectKey(
      directory,
      fileKey,
    );

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: contentType,
    });

    return await getSignedUrl(
      s3ForPresign as never,
      command,
      {
        expiresIn: expiresInSec,
      },
    );
  }

  /**
   * Genera una URL firmada para lectura.
   */
  async generateReadUrl(
    directory: string,
    fileKey: string,
    expiresInSec = 60 * 20,
  ): Promise<string> {
    const objectKey = toFullObjectKey(
      directory,
      fileKey,
    );

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
    });

    return await getSignedUrl(
      s3ForPresign as never,
      command,
      {
        expiresIn: expiresInSec,
      },
    );
  }

  /**
   * Normaliza una object key eliminando `/` iniciales.
   *
   * IMPORTANTE:
   * No elimina segmentos de la ruta.
   *
   * /vehicles-images/vehicle-gallery/file.webp
   *
   * =>
   *
   * vehicles-images/vehicle-gallery/file.webp
   */
  private normalizeObjectKey(
    objectKey: string,
  ): string {
    return objectKey.replace(/^\/+/, "");
  }

  /**
   * Convierte una URL, pathname o object key almacenada
   * en una object key válida para R2.
   *
   * Si `resolveObjectKeyFromStored` ya está preparado para
   * URLs públicas, se utiliza primero.
   */
  private normalizeStoredObjectKey(
    storedPath: string,
  ): string {
    const normalized = storedPath.trim();

    if (!normalized) {
      throw new Error(
        "Ruta de almacén inválida: está vacía.",
      );
    }

    try {
      const parsedUrl = new URL(normalized);

      const pathname = decodeURIComponent(
        parsedUrl.pathname,
      );

      return this.normalizeObjectKey(pathname);
    } catch {
      // No es una URL absoluta.
    }

    return this.normalizeObjectKey(normalized);
  }
}