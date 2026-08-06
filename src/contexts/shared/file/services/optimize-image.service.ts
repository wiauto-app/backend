import path from "node:path";

import sharp from "sharp";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

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
  async execute(
    files: Express.Multer.File[],
    {
      diferente_sizes = false,
      maxWidth = 1920,
      quality = 80,
    }: OptimizeImageOptions = {},
  ): Promise<OptimizedImage[]> {
    const out: OptimizedImage[] = [];

    for (const file of files) {
      const base = sharp(file.buffer)
        .rotate()
        .resize({
          width: maxWidth,
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality, effort: 4 });

      if (diferente_sizes) {
        const [largeBuf, mediumBuf, thumbBuf] = await Promise.all([
          base.clone().toBuffer(),
          base
            .clone()
            .resize(800, 800, { fit: "inside" })
            .webp({ quality, effort: 4 })
            .toBuffer(),
          base
            .clone()
            .resize(300, 300, { fit: "inside" })
            .webp({ quality: Math.min(quality, 75), effort: 4 })
            .toBuffer(),
        ]);

        out.push({
          large: toWebpMulterFile(file, largeBuf),
          medium: toWebpMulterFile(file, mediumBuf),
          thumb: toWebpMulterFile(file, thumbBuf),
        });
      } else {
        const largeBuf = await base.clone().toBuffer();
        out.push({
          large: toWebpMulterFile(file, largeBuf),
        });
      }
    }

    return out;
  }
}
