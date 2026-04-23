import path from "node:path";

import { mimetype_to_extension } from "../media.constants";

const allowed_trailing_ext = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Evita nombres tipo cover_image.jpg.jpg: quita extensiones de imagen repetidas
 * y aplica una sola extensión según el mimetype.
 */
export function normalize_image_filename_for_storage(
  originalname: string,
  mimetype: string,
): string {
  const base = path.basename(originalname).replace(/^\./, "");
  let stem = base;

  for (;;) {
    const { ext, name } = path.parse(stem);
    if (ext.length === 0 || !allowed_trailing_ext.has(ext.toLowerCase())) {
      break;
    }
    stem = name;
  }

  if (stem.length === 0) {
    stem = "image";
  }

  const out_ext =
    mimetype_to_extension[mimetype] ?? (path.extname(base) || ".jpg");
  return `${stem}${out_ext}`;
}
