import type { ImageFormatAdapter } from "../image-format-adapter.interface";
import type { ImageDecodeInput } from "../image-decode-input.interface";
import {
  matchesMimeOrExtension,
  normalizeMime,
} from "../image-format-matching.util";

const MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

const EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

const isJpegBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 3 &&
  buffer[0] === 0xff &&
  buffer[1] === 0xd8 &&
  buffer[2] === 0xff;

const isPngBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 8 &&
  buffer[0] === 0x89 &&
  buffer[1] === 0x50 &&
  buffer[2] === 0x4e &&
  buffer[3] === 0x47;

const isWebpBuffer = (buffer: Buffer): boolean =>
  buffer.length >= 12 &&
  buffer.toString("ascii", 0, 4) === "RIFF" &&
  buffer.toString("ascii", 8, 12) === "WEBP";

export class JpegPngWebpAdapter implements ImageFormatAdapter {
  readonly id = "jpeg-png-webp";

  readonly mimeTypes = MIME_TYPES;

  readonly extensions = EXTENSIONS;

  matches(input: ImageDecodeInput): boolean {
    if (matchesMimeOrExtension(input, this.mimeTypes, this.extensions)) {
      return true;
    }
    const mime = normalizeMime(input.mimeType);
    if (mime === "image/jpeg" || isJpegBuffer(input.buffer)) {
      return isJpegBuffer(input.buffer);
    }
    if (mime === "image/png" || isPngBuffer(input.buffer)) {
      return isPngBuffer(input.buffer);
    }
    if (mime === "image/webp" || isWebpBuffer(input.buffer)) {
      return isWebpBuffer(input.buffer);
    }
    return (
      isJpegBuffer(input.buffer) ||
      isPngBuffer(input.buffer) ||
      isWebpBuffer(input.buffer)
    );
  }

  async toSharpInput(input: ImageDecodeInput): Promise<Buffer> {
    return input.buffer;
  }
}
