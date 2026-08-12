import "dotenv/config";

import { z } from "zod";
export const ONE_HOUR = 1 * 60 * 60 * 1000;
export const MONTH = 30 * 24 * 60 * 60 * 1000;
const envsSchema = z.object({
  PORT: z.coerce.number(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string(),
  ENVIRONMENT: z.string(),
  /** Alineado con cookie access (15 min) en authCookieConfig */
  ACCESS_TOKEN_EXPIRES_IN: z.string().default("1m"),
  
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
  /** URL absoluta del logo en correos; si vacío, usa `MAIL_BRAND_LOGO_URL` de frontend-routes */
  MAIL_BRAND_LOGO_URL: z.string().default(""),

  /** Legado: ya no arma el link del mail; el cliente envía redirect_url */
  FRONTEND_PASSWORD_RESET_URL: z.string().default(""),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default("15m"),

  /** Override opcional del endpoint GET confirm; por defecto BACKEND_URL/auth/email-verification/confirm */
  FRONTEND_EMAIL_VERIFICATION_URL: z.string().default(""),
  FRONTEND_URL: z.string(),
  /** Origen del dashboard admin (allowlist de redirect_url en password recovery) */
  DASHBOARD_URL: z.string(),

  BACKEND_URL: z.string().default("http://localhost:4000"),
  /** Segundos hasta expirar el enlace de verificación (por defecto 48 h) */
  EMAIL_VERIFICATION_TOKEN_EXPIRES_SEC: z.coerce.number().default(86_400),

  REDIS_URL: z.string().default("redis://redis:6379"),
  
  /** Endpoint S3 de cuenta R2. Ej: https://<ACCOUNT_ID>.r2.cloudflarestorage.com */
  R2_S3_ENDPOINT: z.string(),
  /** Base CDN pública path-style. Ej: https://media.wiauto.es */
  R2_PUBLIC_URL: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  /** Único bucket R2 físico. Los “buckets” lógicos son directorios en código. */
  R2_BUCKET_NAME: z.string(),

  OPENSEARCH_URL: z.string().default("http://localhost:9200"),
  OPENSEARCH_INDEX_HERO: z.string().default("vehicles_hero_v1"),

  GOOGLE_MAPS_API_KEY: z.string(),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().default(""),
  
  IA_API_KEY: z.string(),

  DEEPSEEK_API_KEY: z.string(),
  DEEPSEEK_MODEL: z.string().default("deepseek-v4-flash"),

  OPENAI_API_KEY: z.string(),

  WIAUTO_SUPPORT_PHONE: z.string().default("+34 900 000 000"),
  WIAUTO_FAQ_URL: z.string().default(""),

  ASSISTANT_MONTHLY_FREE_QUOTA: z.coerce.number().default(30),

  VEHICLE_AI_THROTTLE_LIMIT: z.coerce.number().default(5),
  VEHICLE_AI_THROTTLE_TTL_MS: z.coerce.number().default(60_000),

  AI_SEARCH_FILTERS_THROTTLE_LIMIT: z.coerce.number().default(10),
  AI_SEARCH_FILTERS_THROTTLE_TTL_MS: z.coerce.number().default(60_000),

  APIVEHICULO_API_KEY: z.string(),
  APIVEHICULO_BASE_URL: z
    .string(),
  VEHICLE_IDENTIFICATION_THROTTLE_LIMIT: z.coerce.number().default(10),
  VEHICLE_IDENTIFICATION_THROTTLE_TTL_MS: z.coerce.number().default(60_000),

  WHATSAPP_ACCESS_TOKEN: z.string(),
  PHONE_NUMBER_ID: z.string(),
  WHATSAPP_API_VERSION: z.string().default("v25.0"),
  WHATSAPP_TEMPLATE_NAME: z
    .string()
    .default("jaspers_market_order_confirmation_v1"),
  WHATSAPP_TEMPLATE_LANGUAGE: z.string().default("en_US"),

  /** Secreto opcional para validar POST /strapi/webhook (header X-Strapi-Webhook-Secret o Authorization Bearer) */
  STRAPI_WEBHOOK_SECRET: z.string().default(""),

  ADMIN_PASSWORD: z.string(),

  //firebase credentials
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
});

const parsed_envs = envsSchema.parse(process.env);

export const envs = {
  ...parsed_envs,
  STRIPE_SUCCESS_URL:
    process.env.STRIPE_SUCCESS_URL?.trim() ??
    `${parsed_envs.FRONTEND_URL}/usuario/monetizacion?checkout=success`,
  STRIPE_CANCEL_URL:
    process.env.STRIPE_CANCEL_URL?.trim() ??
    `${parsed_envs.FRONTEND_URL}/usuario/monetizacion?checkout=cancel`,
};
