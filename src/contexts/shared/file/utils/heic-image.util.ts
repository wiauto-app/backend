import convert from "heic-convert";

import { isAvifBuffer } from "./avif-image.util";

/** Brands HEIC/HEIF específicos (no incluir mif1/msf1 solos: también los usa AVIF). */
const HEIF_BRANDS = new Set([
  "heic",
  "heix",
  "hevc",
  "hevx",
  "heim",
  "heis",
  "hevm",
  "hevs",
  "heif",
]);

const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXTENSIONS = new Set([".heic", ".heif"]);

const collectFtypBrands = (buffer: Buffer): string[] => {
  if (buffer.length < 12 || buffer.toString("ascii", 4, 8) !== "ftyp") {
    return [];
  }

  const brands = [buffer.toString("ascii", 8, 12).toLowerCase()];
  for (let offset = 16; offset + 4 <= Math.min(buffer.length, 64); offset += 4) {
    brands.push(buffer.toString("ascii", offset, offset + 4).toLowerCase());
  }
  return brands;
};

/**
 * Detecta HEIC/HEIF por magic bytes (`ftyp` + brand).
 * Excluye AVIF (mismo contenedor ISO-BMFF / mif1).
 */
export const isHeicOrHeifBuffer = (buffer: Buffer): boolean => {
  if (isAvifBuffer(buffer)) {
    return false;
  }

  const brands = collectFtypBrands(buffer);
  if (brands.length === 0) {
    return false;
  }

  return brands.some((brand) => HEIF_BRANDS.has(brand));
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
  // MIME/nombre AVIF gana; evita heic-convert sobre AVIF mal etiquetado.
  if (isAvifBuffer(file.buffer)) {
    return false;
  }

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
