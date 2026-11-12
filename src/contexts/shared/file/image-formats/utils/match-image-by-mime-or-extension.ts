import path from "node:path";

import type { ImageDecodeInput } from "../image-decode-input.interface";

export const extension_from_object_key = (
  objectKey: string | undefined,
): string | null => {
  if (!objectKey?.trim()) {
    return null;
  }
  const ext = path.extname(objectKey).toLowerCase();
  return ext || null;
};

export const matches_mime_or_extension = (
  input: ImageDecodeInput,
  mimeTypes: readonly string[],
  extensions: readonly string[],
): boolean => {
  const mime = (input.mimeType ?? "").trim().toLowerCase();
  if (mime && mimeTypes.includes(mime)) {
    return true;
  }

  const ext = extension_from_object_key(input.objectKey);
  if (ext && extensions.includes(ext)) {
    return true;
  }

  return false;
};
