import { Request } from "express";

import { envs } from "@/src/common/envs";

const FRONTEND_ORIGINS = new Set(
  (
    process.env.FRONTEND_ORIGINS ??
    "http://localhost:3000,http://localhost:5174,http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const safe_origin = (value: string): string | null => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const get_request_origin = (req: Request): string | null => {
  const origin_header = req.headers.origin;
  if (typeof origin_header === "string" && origin_header.trim()) {
    return safe_origin(origin_header.trim());
  }

  const referer = req.headers.referer;
  if (typeof referer !== "string" || !referer.trim()) {
    return null;
  }

  return safe_origin(referer);
};

const is_dashboard_origin = (origin: string | null): boolean => {
  if (!origin) {
    return false;
  }

  const dashboard_origin = safe_origin(envs.DASHBOARD_URL);
  if (dashboard_origin && origin === dashboard_origin) {
    return true;
  }

  const platform_origin = safe_origin(envs.FRONTEND_URL);
  if (platform_origin && origin === platform_origin) {
    return false;
  }

  // Orígenes permitidos que no son la plataforma (p. ej. :5173 / :5174 del dashboard).
  return FRONTEND_ORIGINS.has(origin);
};

/** Rutas bajo /auth/admin o peticiones con Origin del dashboard. */
export const isAdminAuthRequest = (req: Request): boolean => {
  const path = (req.path || req.url || "").split("?")[0] ?? "";
  if (path.includes("/auth/admin")) {
    return true;
  }

  return is_dashboard_origin(get_request_origin(req));
};
