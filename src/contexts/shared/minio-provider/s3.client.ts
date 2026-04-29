import { envs } from "@/src/common/envs";
import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

const base_s3_config = (endpoint: string): S3ClientConfig => ({
  region: "us-east-1", // MinIO no lo usa pero el SDK lo exige
  endpoint: endpoint.replace(/\/$/, ""),
  credentials: {
    accessKeyId: envs.MINIO_ACCESS_KEY,
    secretAccessKey: envs.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

/** Evita x-amz-checksum-crc32 en URLs presignadas: MinIO suele fallar con SignatureDoesNotMatch. */
const presign_s3_config = (endpoint: string): S3ClientConfig => ({
  ...base_s3_config(endpoint),
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** Llamadas servidor → MinIO (p. ej. en Docker: http://minio:9000) */
export const s3 = new S3Client(base_s3_config(envs.MINIO_S3_URL));

/**
 * Presigned URLs: el `Host` forma parte de la firma. Debe ser la misma base URL
 * que el navegador o la app usarán al subir (normalmente `MINIO_ENDPOINT`, ej. http://localhost:9000).
 */
export const s3_for_presign = new S3Client(presign_s3_config(envs.MINIO_ENDPOINT));
