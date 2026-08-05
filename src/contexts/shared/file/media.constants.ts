export const ONE_KB = 1024;
export const ONE_MB = 1024 * ONE_KB;
export const SIX_MB = 6 * ONE_MB;
/** Límite Multer / galería. HEIC de iPhone puede acercarse a este tope. */
export const TEN_MB = 10 * ONE_MB;

/** MIME admitidos en validación Multer / galería de vehículo. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/tif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * Extensiones admitidas cuando el navegador envía MIME vacío
 * o `application/octet-stream` (frecuente con HEIC).
 */
export const ALLOWED_IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
  ".heif",
] as const;

/** Extensión canónica por MIME (una sola por archivo en storage) */
export const mimetype_to_extension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/tif": ".tiff",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/heic-sequence": ".heic",
  "image/heif-sequence": ".heif",
};

// queues
export const UPLOAD_IMAGE_QUEUE = "upload-image-queue";
export const UPLOAD_VIDEO_QUEUE = "upload-video-queue";

export const GENERATE_FILE_SIGNED_URL = "v1/generate-file-signed-url";
export const CONFIRM_VIDEO_UPLOAD = "v1/confirm-video-upload";
export const GENERATE_READ_FILE_SIGNED_URL = "v1/generate-read-file-signed-url";
export const UPLOAD_TEMP_VEHICLE_IMAGE = "v1/upload-temp-vehicle-image";
export const V1_FILES = "v1/files";
