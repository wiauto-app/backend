import { mimetype_to_extension } from "../../media.constants";
import { extension_from_object_key } from "./match-image-by-mime-or-extension";

const extension_to_mime = Object.fromEntries(
  Object.entries(mimetype_to_extension).map(([mime, ext]) => [ext, mime]),
) as Record<string, string>;

export const resolveMimeTypeFromObjectKey = (
  objectKey: string,
): string | undefined => {
  const extension = extension_from_object_key(objectKey);
  if (!extension) {
    return undefined;
  }
  return extension_to_mime[extension];
};
