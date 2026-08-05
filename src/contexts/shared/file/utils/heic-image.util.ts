import convert from "heic-convert";

/** Brands ISO-BMFF frecuentes en contenedores HEIC/HEIF de Apple y genéricos. */
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "mif1",
  "msf1",
  "heif",
]);

const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

/**
 * Detecta HEIC/HEIF por magic bytes (`ftyp` + brand).
 * Estructura típica: [size:4][ftyp:4][major_brand:4]…
 */
export const isHeicOrHeifBuffer = (buffer: Buffer): boolean => {
  if (buffer.length < 12) {
    return false;
  }

  if (buffer.toString("ascii", 4, 8) !== "ftyp") {
    return false;
  }

  const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
  if (HEIF_BRANDS.has(majorBrand)) {
    return true;
  }

  // Compat brands adicionales a partir del offset 16
  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    const brand = buffer.toString("ascii", offset, offset + 4).toLowerCase();
    if (HEIF_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
};

export const isHeicByMimeOrName = (
  mimetype: string | undefined,
  originalname: string | undefined,
): boolean => {
  const mime = (mimetype ?? "").trim().toLowerCase();
  if (HEIC_MIME_TYPES.has(mime)) {
    return true;
  }

  const name = (originalname ?? "").toLowerCase();
  const dot = name.lastIndexOf(".");
  if (dot < 0) {
    return false;
  }

  return HEIC_EXTENSIONS.has(name.slice(dot));
};

export const shouldConvertHeic = (file: Express.Multer.File): boolean => {
  if (isHeicByMimeOrName(file.mimetype, file.originalname)) {
    return true;
  }
  return isHeicOrHeifBuffer(file.buffer);
};

/** HEIC/HEIF → JPEG (buffer) para que Sharp pueda optimizar a WebP. */
export const convertHeicToJpegBuffer = async (
  buffer: Buffer,
): Promise<Buffer> => {
  const jpeg = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });

  return Buffer.from(jpeg);
};
