/** Segmento de ruta que marca almacenamiento provisional (se elimina al publicar). */
export const TEMP_STORAGE_SEGMENT = "temp";

/**
 * Indica si la ruta compuesta o pathname incluye el segmento `temp`.
 * Acepta `vehicles-images/temp/...` o `temp/vehicles-images/...`.
 */
export const is_temp_storage_path = (stored_path: string): boolean => {
  const normalized = stored_path.trim().replace(/^\/+/, "");
  if (!normalized) {
    return false;
  }
  return normalized.split("/").filter(Boolean).includes(TEMP_STORAGE_SEGMENT);
};

/**
 * Quita el segmento `temp` de una ruta compuesta o pathname.
 *
 * @example
 * promote_temp_storage_path("vehicles-images/temp/vehicle-gallery/a.jpeg")
 * // → "vehicles-images/vehicle-gallery/a.jpeg"
 *
 * @example
 * promote_temp_storage_path("/temp/vehicles-images/vehicle-gallery/a.jpeg")
 * // → "vehicles-images/vehicle-gallery/a.jpeg"
 */
export const promote_temp_storage_path = (stored_path: string): string => {
  const normalized = stored_path.trim().replace(/^\/+/, "");
  if (!normalized) {
    throw new Error("Ruta de almacenamiento vacía");
  }

  const segments = normalized.split("/").filter(Boolean);
  const temp_index = segments.indexOf(TEMP_STORAGE_SEGMENT);
  if (temp_index === -1) {
    return normalized;
  }

  const without_temp = [
    ...segments.slice(0, temp_index),
    ...segments.slice(temp_index + 1),
  ];

  if (without_temp.length < 2) {
    throw new Error(
      'Ruta temporal inválida: se esperaba "directorio/.../archivo" tras quitar temp',
    );
  }

  return without_temp.join("/");
};

/**
 * Separa el directorio lógico (primer segmento) del resto de la key.
 * En R2 hay un solo bucket físico; `directory` no es un bucket de Cloudflare.
 */
export const split_storage_compound_path = (
  compound_path: string,
): { directory: string; object_key: string; bucket_name: string } => {
  const normalized = compound_path.trim().replace(/^\/+/, "");
  const first_slash = normalized.indexOf("/");
  if (first_slash <= 0) {
    throw new Error(
      'Ruta de almacenamiento inválida: se esperaba "directorio/clave-del-objeto"',
    );
  }
  const directory = normalized.slice(0, first_slash);
  const object_key = normalized.slice(first_slash + 1);
  if (!object_key) {
    throw new Error("Ruta de almacenamiento inválida: falta la clave del objeto");
  }
  return { directory, object_key, bucket_name: directory };
};

/** Pathname persistido en BD (`/directorio/clave`). */
export const to_storage_pathname = (compound_path: string): string => {
  const normalized = compound_path.trim().replace(/^\/+/, "");
  return `/${normalized}`;
};
