import path from "node:path";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import sharp from "sharp";

import { ImageOptimizationPipeline } from "../image-formats/image-optimization-pipeline.service";
import {
  IMAGE_OPTIMIZATION_MAX_WIDTH,
  IMAGE_OPTIMIZATION_WEBP_EFFORT,
  IMAGE_OPTIMIZATION_WEBP_QUALITY,
} from "../image-formats/image-optimization.constants";

interface OptimizedImageSizes {
  large: Express.Multer.File;
  medium: Express.Multer.File;
  thumb: Express.Multer.File;
}

interface OptimizedImageSingle {
  large: Express.Multer.File;
}

type OptimizedImage = OptimizedImageSizes | OptimizedImageSingle;

export interface OptimizeImageOptions {
  diferente_sizes?: boolean;
  maxWidth?: number;
  quality?: number;
}

function toWebpMulterFile(
  source: Express.Multer.File,
  webpBuffer: Buffer,
): Express.Multer.File {
  const parsed = path.parse(source.originalname);
  const originalname = path.format({ ...parsed, base: undefined, ext: ".webp" });

  return {
    ...source,
    buffer: webpBuffer,
    size: webpBuffer.length,
    mimetype: "image/webp",
    originalname,
  };
}

@Injectable()
export class OptimizeImageService {
  constructor(
    private readonly imageOptimizationPipeline: ImageOptimizationPipeline,
  ) {}

  async execute(
    files: Express.Multer.File[],
    {
      diferente_sizes = false,
      maxWidth = IMAGE_OPTIMIZATION_MAX_WIDTH,
      quality = IMAGE_OPTIMIZATION_WEBP_QUALITY,
    }: OptimizeImageOptions = {},
  ): Promise<OptimizedImage[]> {
    const out: OptimizedImage[] = [];

    for (const file of files) {
      const optimized = await this.imageOptimizationPipeline.execute(
        {
          buffer: file.buffer,
          mimeType: file.mimetype,
          objectKey: file.originalname,
        },
        { maxWidth, quality, effort: IMAGE_OPTIMIZATION_WEBP_EFFORT },
      );

      if (diferente_sizes) {
        const sharpBase = sharp(optimized.buffer);
        const [mediumBuf, thumbBuf] = await Promise.all([
          sharpBase
            .clone()
            .resize(800, 800, { fit: "inside" })
            .webp({ quality, effort: IMAGE_OPTIMIZATION_WEBP_EFFORT })
            .toBuffer(),
          sharpBase
            .clone()
            .resize(300, 300, { fit: "inside" })
            .webp({
              quality: Math.min(quality, 75),
              effort: IMAGE_OPTIMIZATION_WEBP_EFFORT,
            })
            .toBuffer(),
        ]);

        out.push({
          large: toWebpMulterFile(file, optimized.buffer),
          medium: toWebpMulterFile(file, mediumBuf),
          thumb: toWebpMulterFile(file, thumbBuf),
        });
      } else {
        out.push({
          large: toWebpMulterFile(file, optimized.buffer),
        });
      }
    }

    return out;
  }
}
