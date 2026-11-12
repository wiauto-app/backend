import sharp from "sharp";

import type { ImageFormatAdapter } from "../image-format-adapter.interface";
import type { ImageDecodeInput } from "../image-decode-input.interface";
import { matchesMimeOrExtension } from "../image-format-matching.util";

const MIME_TYPES = [
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/tif",
] as const;

const EXTENSIONS = [".gif", ".bmp", ".tif", ".tiff"] as const;

const isGifBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 6 &&
  (buffer.toString("ascii", 0, 6) === "GIF87a" ||
    buffer.toString("ascii", 0, 6) === "GIF89a");

const isBmpBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 2 && buffer.toString("ascii", 0, 2) === "BM";

const isTiffBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 4 &&
  ((buffer[0] === 0x49 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x2a &&
    buffer[3] === 0x00) ||
    (buffer[0] === 0x4d &&
      buffer[1] === 0x4d &&
      buffer[2] === 0x00 &&
      buffer[3] === 0x2a));

export class GifBmpTiffAdapter implements ImageFormatAdapter {
  readonly id = "gif-bmp-tiff";

  readonly mimeTypes = MIME_TYPES;

  readonly extensions = EXTENSIONS;

  matches(input: ImageDecodeInput): boolean {
    if (matchesMimeOrExtension(input, this.mimeTypes, this.extensions)) {
      return true;
    }
    return (
      isGifBuffer(input.buffer) ||
      isBmpBuffer(input.buffer) ||
      isTiffBuffer(input.buffer)
    );
  }

  async toSharpInput(input: ImageDecodeInput): Promise<Buffer> {
    return sharp(input.buffer).rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
  }
}
