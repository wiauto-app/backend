import { Request } from "express";

import { envs } from "@/src/common/envs";





/** Rutas bajo /auth/admin o peticiones con Origin del dashboard. */
export const isAdminAuthRequest = (req: Request): boolean => {
  const origin = req.headers.origin;

  if (origin === envs.DASHBOARD_URL) {
    return true;
  }

  return false;
};
