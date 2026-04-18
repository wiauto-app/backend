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

  MAIL_HOST: z.string().default("smtp.gmail.com"),
  MAIL_PORT: z.coerce.number().default(587),
  MAIL_USER: z.string().default(""),
  MAIL_PASSWORD: z.string().default(""),
  MAIL_FROM: z.string().default('"No Reply" <noreply@example.com>'),

  FRONTEND_PASSWORD_RESET_URL: z.string().default(""),
  PASSWORD_RESET_TOKEN_EXPIRES_IN: z.string().default("15m"),
});

export const envs = envsSchema.parse(process.env);
