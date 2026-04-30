import { Observable, from } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import {
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { envs } from '@/src/common/envs';
import { s3, s3_for_presign } from './s3.client';
import { Injectable } from '../dependency-injectable/injectable';

@Injectable()
export class MinioService {
  private bucketName: string;
  private videoBucketName: string;
  constructor() {
    this.bucketName = envs.MINIO_BUCKET_NAME;
    this.videoBucketName = envs.MINIO_VIDEO_BUCKET_NAME;
  }

  /**
   * Sube un buffer a MinIO y devuelve la URL pública
   * @param file Buffer del archivo a subir
   * @param storagePath Ruta (key) dentro del bucket
   * @param contentType MIME type del archivo
   */
  uploadFile(
    file: Buffer,
    storagePath: string,
    contentType: string,
  ): Observable<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: storagePath,
      Body: file,
      ContentType: contentType,
    });

    return from(s3.send(command)).pipe(
      switchMap(() => this.getPublicUrl(storagePath)),
      catchError((error: Error) => {
        console.error("Error uploading file: ", error)
        throw new Error(`Error uploading file: ${error.message}`);
      }),
    );
  }

  /**
   * Lee un objeto (servidor) sin depender de bucket público.
   */
  async getObjectBuffer(bucket_name: string, object_key: string): Promise<Buffer | null> {
    try {
      const response = await s3.send(
        new GetObjectCommand({ Bucket: bucket_name, Key: object_key }),
      );
      if (!response.Body) {
        return null;
      }
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (e) {
      const status = (e as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
      if (status === 404) {
        return null;
      }
      throw e;
    }
  }

  /**
   * Sube o reemplaza un objeto en un bucket concreto (p. ej. vídeos).
   */
  async putObjectToBucket(
    bucket_name: string,
    object_key: string,
    body: Buffer,
    content_type: string,
  ): Promise<void> {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket_name,
        Key: object_key,
        Body: body,
        ContentType: content_type,
      }),
    );
  }

  /**
   * Genera la URL pública para leer un archivo
   * @param storagePath Ruta (key) dentro del bucket
   */
  getPublicUrl(storagePath: string): Observable<string> {
    // Construir URL pública de MinIO
    // Formato: http://endpoint/bucket/key
    const endpoint = envs.MINIO_ENDPOINT.replace(/\/$/, ''); // Remover trailing slash si existe
    const publicUrl = `${endpoint}/${this.bucketName}/${storagePath}`;

    return from(Promise.resolve(publicUrl)).pipe(
      map((url) => url),
      catchError((error: Error) => {
        throw new Error(`Error generating public URL: ${error.message}`);
      }),
    );
  }

  /**
   * Elimina un objeto por `bucket` y `key` (p. ej. bucket de vídeos).
   */
  async deleteObjectFromBucket(bucket_name: string, object_key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({ Bucket: bucket_name, Key: object_key }),
    );
  }

  /**
   * Obtiene la clave del objeto (Key) en el bucket por defecto a partir de:
   * - URL absoluta `http(s)://.../bucket/key...`
   * - Path guardado por el adaptador: `/bucket/key...` (sin host; fallaba con `new URL`)
   * - Clave directa: `vehicles/uuid/archivo.jpg`
   */
  private extract_default_bucket_object_key(stored: string): string {
    const trimmed = stored.trim();
    if (!trimmed) {
      throw new Error("Referencia de almacenamiento vacía");
    }

    if (/^https?:\/\//i.test(trimmed)) {
      if (trimmed.includes("storage.googleapis.com")) {
        let urlObj: URL;
        try {
          urlObj = new URL(trimmed);
        } catch {
          throw new Error("URL inválida");
        }
        const gcsParts = urlObj.pathname.split("/").filter(Boolean);
        const gcsBucketIndex = gcsParts.findIndex((part) =>
          part.includes("bucket"),
        );
        return gcsBucketIndex !== -1
          ? gcsParts.slice(gcsBucketIndex + 1).join("/")
          : gcsParts.slice(1).join("/");
      }
      if (!trimmed.includes(this.bucketName)) {
        const pathname = (() => {
          try {
            return new URL(trimmed).pathname;
          } catch {
            throw new Error("URL inválida");
          }
        })();
        return this.extract_default_bucket_object_key(pathname);
      }
      let urlObj: URL;
      try {
        urlObj = new URL(trimmed);
      } catch {
        throw new Error("URL inválida");
      }
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const bucketIndex = pathParts.indexOf(this.bucketName);
      if (bucketIndex === -1) {
        throw new Error("No se pudo extraer la clave del archivo de la URL");
      }
      return pathParts.slice(bucketIndex + 1).join("/");
    }

    if (trimmed.startsWith("/")) {
      const pathParts = trimmed.split("/").filter(Boolean);
      const bucketIndex = pathParts.indexOf(this.bucketName);
      if (bucketIndex !== -1) {
        return pathParts.slice(bucketIndex + 1).join("/");
      }
      return pathParts.join("/");
    }

    return trimmed.replace(/^\//, "");
  }

  /**
   * Elimina un archivo del bucket
   * @param storagePath Ruta (key) dentro del bucket
   */
  deleteFile(storagePath: string): Observable<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: storagePath,
    });

    return from(s3.send(command)).pipe(
      map(() => undefined),
      catchError((error) => {
        throw new Error(`Error deleting file: ${error.message}`);
      }),
    );
  }

  /**
   * Elimina objeto del bucket por defecto. Acepta URL pública, path tipo `/bucket/key` (lo que persiste el adaptador) o la key S3.
   */
  deleteFileByUrl(url: string): Observable<void> {
    const filePath = this.extract_default_bucket_object_key(url);
    return this.deleteFile(filePath);
  }

  /**
   * URL firmada para subida directa (p. ej. desde el front). Debe usarse
   * `s3_for_presign` (MINIO_ENDPOINT) para que el Host coincida con el del cliente
   * que hace el PUT. No reescribir el host: rompe la firma SigV4.
   */
  async generateUploadUrl(bucketName: string, fileKey: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      ContentType: contentType,
    });
    return await getSignedUrl(s3_for_presign as never, command, {
      expiresIn: 60 * 20,
    });
  }
}
