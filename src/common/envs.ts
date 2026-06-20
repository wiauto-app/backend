import "dotenv/config";

import { z } from "zod";
export const ONE_HOUR = 1 * 60 * 60 * 1000;
export const MONTH = 30 * 24 * 60 * 60 * 1000;
const envsSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string(),

  ACCESS_TOKEN_EXPIRES_IN: z.string().default("15m"),
  
  /** Callback Next (ej. http://localhost:3000/api/auth/callback) — OAuth y verificación de email */
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

  /** Override opcional del endpoint GET confirm; por defecto BACKEND_URL/auth/email-verification/confirm */
  FRONTEND_EMAIL_VERIFICATION_URL: z.string().default(""),
  FRONTEND_URL: z.string().default("http://localhost:3000"),

  BACKEND_URL: z.string().default("http://localhost:4000"),
  /** Segundos hasta expirar el enlace de verificación (por defecto 48 h) */
  EMAIL_VERIFICATION_TOKEN_EXPIRES_SEC: z.coerce.number().default(86_400),

  REDIS_URL: z.string().default("redis://redis:6379"),
  
  /** Base URL pública (navegador, presigned). Ej: http://localhost:9000 */
  MINIO_ENDPOINT: z.string(),
  /** API S3 del backend (mismo servicio, host interno en Docker: http://minio:9000) */
  MINIO_S3_URL: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),

  MINIO_VIDEO_BUCKET_NAME: z.string(),
  MINIO_BUCKET_NAMES: z
  .string()
  .transform((value) => value.split(",")),

  OPENSEARCH_URL: z.string().default("http://localhost:9200"),
  OPENSEARCH_INDEX_HERO: z.string().default("vehicles_hero_v1"),

  GOOGLE_MAPS_API_KEY: z.string(),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  
  IA_API_KEY: z.string(),
});

const parsed_envs = envsSchema.parse(process.env);

export const envs = {
  ...parsed_envs,
  STRIPE_SUCCESS_URL:
    process.env.STRIPE_SUCCESS_URL?.trim() ||
    `${parsed_envs.FRONTEND_URL}/monetizacion?checkout=success`,
  STRIPE_CANCEL_URL:
    process.env.STRIPE_CANCEL_URL?.trim() ||
    `${parsed_envs.FRONTEND_URL}/monetizacion?checkout=cancel`,
};
