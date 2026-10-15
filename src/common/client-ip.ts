import type { Request } from "express";

import { envs } from "./envs";

/**
 * Convierte `TRUST_PROXY` al valor que espera Express (`app.set("trust proxy", …)`).
 * "false"/"" → false, "true" → true (no recomendado: permite falsear la IP),
 * número → saltos de proxy, cualquier otro valor → lista de IPs/subredes/presets.
 */
export const parseTrustProxy = (raw: string): boolean | number | string => {
  const value = raw.trim();
  if (value === "" || value.toLowerCase() === "false") {
    return false;
  }
  if (value.toLowerCase() === "true") {
    return true;
  }
  if (/^\d+$/.test(value)) {
    return Number(value);
  }
  return value;
};

/**
 * IP real del cliente para rate limiting y claves por invitado.
 * Prioriza `CLIENT_IP_HEADER` (p. ej. `cf-connecting-ip`) si está configurada;
 * si no, `req.ip`, que ya respeta `trust proxy` (X-Forwarded-For solo de proxies de confianza).
 */
export const resolveClientIp = (req: Request): string => {
  if (envs.CLIENT_IP_HEADER) {
    const raw = req.headers[envs.CLIENT_IP_HEADER];
    const value = Array.isArray(raw) ? raw[0] : raw;
    const ip = value?.split(",")[0]?.trim();
    if (ip) {
      return ip;
    }
  }

  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
};
