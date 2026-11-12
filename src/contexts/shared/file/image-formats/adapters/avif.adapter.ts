import type { ImageFormatAdapter } from "../image-format-adapter.interface";
import type { ImageDecodeInput } from "../image-decode-input.interface";
import { matchesMimeOrExtension } from "../image-format-matching.util";
import {
  convertAvifToJpegBuffer,
  isAvifBuffer,
} from "../../utils/avif-image.util";

const MIME_TYPES = ["image/avif"] as const;
const EXTENSIONS = [".avif"] as const;

export class AvifAdapter implements ImageFormatAdapter {
  readonly id = "avif";

  readonly mimeTypes = MIME_TYPES;

  readonly extensions = EXTENSIONS;

  matches(input: ImageDecodeInput): boolean {
    if (isAvifBuffer(input.buffer)) {
      return true;
    }
    return matchesMimeOrExtension(input, this.mimeTypes, this.extensions);
  }

  async toSharpInput(input: ImageDecodeInput): Promise<Buffer> {
    return convertAvifToJpegBuffer(input.buffer);
  }
}
