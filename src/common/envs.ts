import "dotenv/config";

import { z } from "zod";

const envsSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string(),

  FRONTEND_REDIRECT_URL: z.string().default(""),

  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_CALLBACK_URL: z.string().default(""),

  APPLE_CLIENT_ID: z.string().default(""),
  APPLE_TEAM_ID: z.string().default(""),
  APPLE_KEY_ID: z.string().default(""),
  APPLE_PRIVATE_KEY: z.string().default(""),
  APPLE_CALLBACK_URL: z.string().default(""),

  TWO_FACTOR_ENCRYPTION_KEY: z.string(),
  TWO_FACTOR_ISSUER:z.string(),

  SESSION_SECRET: z.string().default("change-me-session-secret-32bytes-min"),

  MAIL_HOST: z.string(),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string(),
  MAIL_PASSWORD: z.string(),
  MAIL_FROM: z.string().default('"No Reply" <noreply@example.com>'),

  FRONTEND_PASSWORD_RESET_URL: z.string().default(""),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default("15m"),

  /** URL del front (ej. https://app.tudominio.com/verify-email) — se añade ?token= */
  FRONTEND_EMAIL_VERIFICATION_URL: z.string(),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  /** Segundos hasta expirar el enlace de verificación (por defecto 48 h) */
  EMAIL_VERIFICATION_TOKEN_EXPIRES_SEC: z.coerce.number().default(86_400),

  REDIS_URL: z.string().default("redis://redis:6379"),
  
  /** Base URL pública (navegador, presigned). Ej: http://localhost:9000 */
  MINIO_ENDPOINT: z.string(),
  /** API S3 del backend (mismo servicio, host interno en Docker: http://minio:9000) */
  MINIO_S3_URL: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),

  MINIO_BUCKET_NAME: z.string(),
  MINIO_VIDEO_BUCKET_NAME: z.string(),
});

export const envs = envsSchema.parse(process.env);
