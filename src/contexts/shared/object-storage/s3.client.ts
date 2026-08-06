import { envs } from "@/src/common/envs";
import { S3Client, type S3ClientConfig } from "@aws-sdk/client-s3";

const r2S3Config = (): S3ClientConfig => ({
  region: "auto",
  endpoint: envs.R2_S3_ENDPOINT.replace(/\/$/, ""),
  credentials: {
    accessKeyId: envs.R2_ACCESS_KEY_ID,
    secretAccessKey: envs.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

/** Cliente S3-compatible contra Cloudflare R2 (servidor + presign). */
export const s3 = new S3Client(r2S3Config());

/** Alias: en R2 el endpoint de firma es el mismo API S3 de cuenta. */
export const s3ForPresign = s3;
