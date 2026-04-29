

export const ONE_KB = 1024;
export const ONE_MB = 1024 * 1024;
export const SIX_MB = 6 * ONE_MB;
export const ALLOWED_IMAGES_COUNT = 10;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

/** Extensión canónica por MIME (una sola por archivo en storage) */
export const mimetype_to_extension: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// queues
export const UPLOAD_IMAGE_QUEUE = "upload-image-queue";
export const UPLOAD_VIDEO_QUEUE = "upload-video-queue";

export const GENERATE_VIDEO_SIGNED_URL = "v1/generate-video-signed-url";
export const CONFIRM_VIDEO_UPLOAD = "v1/confirm-video-upload";