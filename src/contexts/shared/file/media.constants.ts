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

/** MIME admitidos en temp-upload async de vehículos (`/publicar`). */
export const ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES = ALLOWED_MIME_TYPES;

export type AllowedVehicleTempUploadMime =
  (typeof ALLOWED_VEHICLE_TEMP_UPLOAD_MIMES)[number];

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
export const PROCESS_VEHICLE_IMAGE_QUEUE = "process-vehicle-image-queue";

export const GENERATE_FILE_SIGNED_URL = "v1/generate-file-signed-url";
export const CONFIRM_VIDEO_UPLOAD = "v1/confirm-video-upload";
export const GENERATE_READ_FILE_SIGNED_URL = "v1/generate-read-file-signed-url";
export const UPLOAD_TEMP_VEHICLE_IMAGE = "v1/upload-temp-vehicle-image";
export const V1_FILES = "v1/files";

// Vídeos de vehículos (subida multipart directa a R2 + FFmpeg)
export const PROCESS_VEHICLE_VIDEO_QUEUE = "process-vehicle-video-queue";

export const VEHICLE_VIDEO_MAX_SIZE_BYTES = 300 * ONE_MB;
export const VEHICLE_VIDEO_MAX_DURATION_S = 120;
/** Margen sobre la duración máxima (redondeos de contenedor). */
export const VEHICLE_VIDEO_DURATION_TOLERANCE_S = 1;
/** Lado largo máximo del MP4 optimizado (1080p). */
export const VEHICLE_VIDEO_MAX_LONG_SIDE = 1920;
/** Tamaño de parte multipart (R2 exige ≥ 5 MiB salvo la última). */
export const VEHICLE_VIDEO_PART_SIZE = 10 * ONE_MB;
export const VEHICLE_VIDEO_MAX_PART_URLS_PER_REQUEST = 20;

/** MIME de vídeo admitidos → extensión del original en R2. */
export const VEHICLE_VIDEO_MIME_TO_EXTENSION: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/x-m4v": ".m4v",
  "video/quicktime": ".mov",
  "video/mov": ".mov",
  "video/webm": ".webm",
  "video/x-matroska": ".mkv",
  "video/mkv": ".mkv",
  "video/x-msvideo": ".avi",
  "video/avi": ".avi",
  "video/3gpp": ".3gp",
};

/** Alias no estándar (React Native, algunos navegadores) → MIME canónico. */
export const VEHICLE_VIDEO_MIME_ALIASES: Record<string, string> = {
  "video/mov": "video/quicktime",
  "video/mkv": "video/x-matroska",
  "video/avi": "video/x-msvideo",
};

export const ALLOWED_VEHICLE_VIDEO_MIMES = Object.keys(
  VEHICLE_VIDEO_MIME_TO_EXTENSION,
);
