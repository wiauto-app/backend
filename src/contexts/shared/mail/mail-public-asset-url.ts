import { envs } from "@/src/common/envs";

/**
 * Absolutiza rutas de assets (imagen de vehículo, logo) para HTML de correo.
 * Las URLs de MinIO suelen guardarse como pathname (`/bucket/key`).
 */
export const toAbsoluteMailAssetUrl = (
  path_or_url: string | null | undefined,
): string | null => {
  if (!path_or_url?.trim()) {
    return null;
  }

  const value = path_or_url.trim();
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const base = envs.MINIO_ENDPOINT.replace(/\/$/, "");
  const path = value.startsWith("/") ? value : `/${value}`;
  return `${base}${path}`;
};
