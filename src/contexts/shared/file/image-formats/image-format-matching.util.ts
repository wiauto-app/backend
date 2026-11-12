import path from "node:path";

import type { ImageDecodeInput } from "./image-decode-input.interface";

export const normalizeMime = (mime: string | undefined): string =>
  (mime ?? "").trim().toLowerCase();

export const extensionFromObjectKey = (
  objectKey: string | undefined,
): string | null => {
  if (!objectKey?.trim()) {
    return null;
  }
  const base = path.basename(objectKey.trim());
  const dot = base.lastIndexOf(".");
  if (dot < 0) {
    return null;
  }
  return base.slice(dot).toLowerCase();
};

export const matchesMimeOrExtension = (
  input: ImageDecodeInput,
  mimeTypes: readonly string[],
  extensions: readonly string[],
): boolean => {
  const mime = normalizeMime(input.mimeType);
  if (mime && mimeTypes.includes(mime)) {
    return true;
  }

  const extension = extensionFromObjectKey(input.objectKey);
  if (extension && extensions.includes(extension)) {
    return true;
  }

  return false;
};
