import type { ImageDecodeInput } from "./image-decode-input.interface";

export interface ImageFormatAdapter {
  readonly id: string;
  readonly mimeTypes: readonly string[];
  readonly extensions: readonly string[];
  matches(input: ImageDecodeInput): boolean;
  /** Decodifica a raster apto para Sharp (p. ej. JPEG/PNG intermedio). */
  toSharpInput(input: ImageDecodeInput): Promise<Buffer>;
}
