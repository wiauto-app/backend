import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import type { ImageDecodeInput } from "./image-decode-input.interface";
import type { ImageFormatAdapter } from "./image-format-adapter.interface";
import { AvifAdapter } from "./adapters/avif.adapter";
import { HeicHeifAdapter } from "./adapters/heic-heif.adapter";
import { GifBmpTiffAdapter } from "./adapters/gif-bmp-tiff.adapter";
import { JpegPngWebpAdapter } from "./adapters/jpeg-png-webp.adapter";

@Injectable()
export class ImageFormatRegistry {
  private readonly adapters: ImageFormatAdapter[];

  constructor() {
    this.adapters = [
      new AvifAdapter(),
      new HeicHeifAdapter(),
      new JpegPngWebpAdapter(),
      new GifBmpTiffAdapter(),
    ];
  }

  resolve(input: ImageDecodeInput): ImageFormatAdapter {
    const adapter = this.adapters.find((candidate) => candidate.matches(input));
    if (!adapter) {
      throw new Error(
        "Formato de imagen no reconocido. Usa JPEG, PNG, WebP, AVIF, HEIC/HEIF, GIF, BMP o TIFF.",
      );
    }
    return adapter;
  }

  /** Expuesto para tests (orden de precedencia AVIF → HEIC → …). */
  listAdapters(): readonly ImageFormatAdapter[] {
    return this.adapters;
  }
}
