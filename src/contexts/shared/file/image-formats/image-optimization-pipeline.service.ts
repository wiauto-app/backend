import sharp from "sharp";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { CONTENT_TYPES } from "../ports/file-storage.port";
import type { ImageDecodeInput } from "./image-decode-input.interface";
import { ImageFormatRegistry } from "./image-format-registry.service";
import {
  IMAGE_OPTIMIZATION_MAX_WIDTH,
  IMAGE_OPTIMIZATION_WEBP_EFFORT,
  IMAGE_OPTIMIZATION_WEBP_QUALITY,
} from "./image-optimization.constants";

export interface ImageOptimizationResult {
  buffer: Buffer;
  contentType: typeof CONTENT_TYPES.IMAGE_WEBP;
  extension: ".webp";
}

export interface ImageOptimizationPipelineOptions {
  maxWidth?: number;
  quality?: number;
  effort?: number;
}

@Injectable()
export class ImageOptimizationPipeline {
  constructor(private readonly imageFormatRegistry: ImageFormatRegistry) {}

  async execute(
    input: ImageDecodeInput,
    options: ImageOptimizationPipelineOptions = {},
  ): Promise<ImageOptimizationResult> {
    const maxWidth = options.maxWidth ?? IMAGE_OPTIMIZATION_MAX_WIDTH;
    const quality = options.quality ?? IMAGE_OPTIMIZATION_WEBP_QUALITY;
    const effort = options.effort ?? IMAGE_OPTIMIZATION_WEBP_EFFORT;

    const adapter = this.imageFormatRegistry.resolve(input);
    const sharpInput = await adapter.toSharpInput(input);

    const webpBuffer = await sharp(sharpInput)
      .rotate()
      .resize({
        width: maxWidth,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality, effort })
      .toBuffer();

    return {
      buffer: webpBuffer,
      contentType: CONTENT_TYPES.IMAGE_WEBP,
      extension: ".webp",
    };
  }
}
