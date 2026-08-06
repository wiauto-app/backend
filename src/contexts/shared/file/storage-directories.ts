/**
 * Directorios lógicos dentro del único bucket R2 (`R2_BUCKET_NAME`).
 * No son buckets de Cloudflare: el custom domain apunta a un solo bucket
 * y la key es `{directory}/{resto}`.
 */
export const STORAGE_DIRECTORIES = {
  VEHICLES_IMAGES: "vehicles-images",
  VEHICLES_VIDEOS: "vehicles-videos",
  DEALERSHIP_IMAGES: "dealership-images",
  PROFILE_IMAGES: "profile-images",
  CHAT_ATTACHMENTS: "chat-attachments",
  FILES: "files",
} as const;

export type StorageDirectory =
  (typeof STORAGE_DIRECTORIES)[keyof typeof STORAGE_DIRECTORIES];

export const STORAGE_DIRECTORY_VALUES: StorageDirectory[] = Object.values(
  STORAGE_DIRECTORIES,
);

export const isStorageDirectory = (
  value: string,
): value is StorageDirectory =>
  (STORAGE_DIRECTORY_VALUES as string[]).includes(value);

/**
 * Une directorio + clave relativa. Si `relativeKey` ya empieza por el
 * directorio, no duplica el prefijo.
 */
export const toFullObjectKey = (
  directory: string,
  relativeKey: string,
): string => {
  const dir = directory.trim().replace(/^\/+|\/+$/g, "");
  const key = relativeKey.trim().replace(/^\/+/, "");
  if (!dir) {
    throw new Error("Directorio de almacenamiento vacío");
  }
  if (!key) {
    throw new Error("Clave de objeto vacía");
  }
  if (key === dir || key.startsWith(`${dir}/`)) {
    return key;
  }
  return `${dir}/${key}`;
};

/** Pathname o compound → key completa dentro del bucket único. */
export const resolveObjectKeyFromStored = (stored: string): string => {
  const trimmed = stored.trim();
  if (!trimmed) {
    throw new Error("Referencia de almacenamiento vacía");
  }
  if (/^https?:\/\//i.test(trimmed)) {
    let pathname: string;
    try {
      pathname = new URL(trimmed).pathname;
    } catch {
      throw new Error("URL inválida");
    }
    return resolveObjectKeyFromStored(pathname);
  }
  return trimmed.replace(/^\/+/, "");
};
