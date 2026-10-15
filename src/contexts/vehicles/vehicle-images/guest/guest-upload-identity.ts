import { isUUID } from "class-validator";
import { CookieOptions, Request, Response } from "express";

import { authCookieConfig } from "@/src/contexts/auth/cookie.config";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";

/** Cookie httpOnly que identifica a un invitado que sube fotos antes de iniciar sesión. */
export const GUEST_ID_COOKIE_NAME = "wiauto_guest_id";

const THIRTY_DAYS = 1000 * 60 * 60 * 24 * 30;

// Mismas opciones (secure/sameSite/domain/path) que las cookies de sesión
export const guestIdCookieOptions: CookieOptions = {
  ...authCookieConfig.access_token,
  maxAge: THIRTY_DAYS,
};

/** Devuelve el guest_id de la cookie si es un uuid v4 válido. */
export const readGuestId = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const value = cookies?.[GUEST_ID_COOKIE_NAME]?.trim();
  return value && isUUID(value, "4") ? value : null;
};

/** Lee el guest_id de la cookie o emite uno nuevo si falta. */
export const resolveGuestId = (req: Request, res: Response): string => {
  const existing = readGuestId(req);
  if (existing) {
    return existing;
  }

  const guestId = uuidv4();
  res.cookie(GUEST_ID_COOKIE_NAME, guestId, guestIdCookieOptions);
  return guestId;
};
