import type { ImageFormatAdapter } from "../image-format-adapter.interface";
import type { ImageDecodeInput } from "../image-decode-input.interface";
import { matchesMimeOrExtension } from "../image-format-matching.util";
import {
  convertHeicToJpegBuffer,
  isHeicOrHeifBuffer,
} from "../../utils/heic-image.util";
import { isAvifBuffer } from "../../utils/avif-image.util";

const MIME_TYPES = [
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
] as const;

const EXTENSIONS = [".heic", ".heif"] as const;

export class HeicHeifAdapter implements ImageFormatAdapter {
  readonly id = "heic-heif";

  readonly mimeTypes = MIME_TYPES;

  readonly extensions = EXTENSIONS;

  matches(input: ImageDecodeInput): boolean {
    if (isAvifBuffer(input.buffer)) {
      return false;
    }
    if (isHeicOrHeifBuffer(input.buffer)) {
      return true;
    }
    return matchesMimeOrExtension(input, this.mimeTypes, this.extensions);
  }

  async toSharpInput(input: ImageDecodeInput): Promise<Buffer> {
    return convertHeicToJpegBuffer(input.buffer);
  }
}
