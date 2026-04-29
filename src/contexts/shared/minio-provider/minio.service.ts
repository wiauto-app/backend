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
   * Elimina un archivo por su URL
   * @param url URL del archivo
   */
  deleteFileByUrl(url: string): Observable<void> {
    // Extraer la ruta del archivo de la URL
    let filePath: string;

    try {
      // Si es una URL de MinIO, extraer la ruta después del bucket name
      if (url.includes(this.bucketName)) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter((p) => p);
        const bucketIndex = pathParts.indexOf(this.bucketName);
        if (bucketIndex !== -1) {
          filePath = pathParts.slice(bucketIndex + 1).join('/');
        } else {
          throw new Error('No se pudo extraer la ruta del archivo de la URL');
        }
      }
      // Si es una URL de GCS (para compatibilidad con URLs antiguas)
      else if (url.includes('storage.googleapis.com')) {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        // Buscar el bucket y tomar todo lo que viene después
        const bucketIndex = pathParts.findIndex((part) =>
          part.includes('bucket'),
        );
        filePath = bucketIndex !== -1 ? pathParts.slice(bucketIndex + 1).join('/') : pathParts.slice(1).join('/');
        filePath = pathParts.slice(1).join('/');
      }
      // Si ya es una ruta directa, usarla tal como está
      else {
        filePath = url;
      }
    } catch (error) {
      throw new Error(`URL inválida: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

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
