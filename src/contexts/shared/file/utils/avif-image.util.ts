import sharp from "sharp";

/** Brands ISO-BMFF de AVIF (major o compatible). */
const AVIF_BRANDS = new Set(["avif", "avis", "avio"]);

const AVIF_MIME_TYPES = new Set(["image/avif"]);

const AVIF_EXTENSIONS = new Set([".avif"]);

/**
 * Detecta AVIF por magic bytes (`ftyp` + brand).
 * Incluye contenedores con major `mif1` y compatible `avif`.
 */
export const isAvifBuffer = (buffer: Buffer): boolean => {
  if (buffer.length < 12) {
    return false;
  }

  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }

  const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
  if (AVIF_BRANDS.has(majorBrand)) {
    return true;
  }

  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    const brand = buffer.toString("ascii", offset, offset + 4).toLowerCase();
    if (AVIF_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
};

export const isAvifByMimeOrName = (
  mimetype: string | undefined,
  originalname: string | undefined,
): boolean => {
  const mime = (mimetype ?? "").trim().toLowerCase();
  if (AVIF_MIME_TYPES.has(mime)) {
    return true;
  }

  const name = (originalname ?? "").toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }

  return AVIF_EXTENSIONS.has(name.slice(dot));
};

export const shouldConvertAvif = (file: Express.Multer.File): boolean => {
  if (isAvifByMimeOrName(file.mimetype, file.originalname)) {
    return true;
  }
  return isAvifBuffer(file.buffer);
};

/** AVIF → JPEG para que el pipeline Sharp → WebP sea fiable. */
export const convertAvifToJpegBuffer = async (
  buffer: Buffer,
): Promise<Buffer> => {
  return sharp(buffer).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
};
