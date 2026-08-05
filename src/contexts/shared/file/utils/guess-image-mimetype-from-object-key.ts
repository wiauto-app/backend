import path from "node:path";

import {
  CONTENT_TYPES,
  type ContentType,
} from "../ports/file-storage.port";

export const guess_image_mimetype_from_object_key = (
  object_key: string,
): ContentType => {
  const ext = path.extname(object_key).toLowerCase();

  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return CONTENT_TYPES.IMAGE_JPEG;
    case ".png":
      return CONTENT_TYPES.IMAGE_PNG;
    case ".webp":
      return CONTENT_TYPES.IMAGE_WEBP;
    case ".avif":
      return CONTENT_TYPES.IMAGE_AVIF;
    case ".heic":
      return CONTENT_TYPES.IMAGE_HEIC;
    case ".heif":
      return CONTENT_TYPES.IMAGE_HEIF;
    default:
      return CONTENT_TYPES.IMAGE_JPEG;
  }
};
