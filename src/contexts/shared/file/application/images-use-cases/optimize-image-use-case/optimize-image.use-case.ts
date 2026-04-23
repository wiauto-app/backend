import path from "node:path";

import sharp from "sharp";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

type optimized_image =
  | {
      large: Express.Multer.File;
      medium: Express.Multer.File;
      thumb: Express.Multer.File;
    }
  | {
      large: Express.Multer.File;
    };

function to_webp_multer_file(
  source: Express.Multer.File,
  webp_buffer: Buffer,
): Express.Multer.File {
  const parsed = path.parse(source.originalname);
  const originalname = path.format({ ...parsed, base: undefined, ext: ".webp" });

  return {
    ...source,
    buffer: webp_buffer,
    size: webp_buffer.length,
    mimetype: "image/webp",
    originalname,
  };
}

@Injectable()
export class OptimizeImageUseCase {
  async execute(
    files: Express.Multer.File[],
    {
      diferente_sizes = false,
    }: {
      diferente_sizes?: boolean;
    },
  ): Promise<optimized_image[]> {
    const out: optimized_image[] = [];

    for (const file of files) {
      const base = sharp(file.buffer)
        .rotate()
        .resize({
          width: 1920,
          withoutEnlargement: true,
          fit: "inside",
        })
        .webp({ quality: 80, effort: 4 });

      if (diferente_sizes) {
        const [large_buf, medium_buf, thumb_buf] = await Promise.all([
          base.clone().toBuffer(),
          base.clone().resize(800, 800, { fit: "inside" }).webp({ quality: 80, effort: 4 }).toBuffer(),
          base.clone().resize(300, 300, { fit: "inside" }).webp({ quality: 75, effort: 4 }).toBuffer(),
        ]);

        out.push({
          large: to_webp_multer_file(file, large_buf),
          medium: to_webp_multer_file(file, medium_buf),
          thumb: to_webp_multer_file(file, thumb_buf),
        });
      } else {
        const large_buf = await base.clone().toBuffer();
        out.push({
          large: to_webp_multer_file(file, large_buf),
        });
      }
    }

    return out;
  }
}
