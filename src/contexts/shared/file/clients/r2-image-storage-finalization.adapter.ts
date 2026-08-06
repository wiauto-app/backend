import path from "node:path";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";

import { OptimizeImageService } from "../services/optimize-image.service";
import { TempStoragePathInvalidException } from "../exceptions/temp-storage-path-invalid.exception";
import { ImageStorageFinalizationPort } from "../ports/image-storage-finalization.port";
import { CONTENT_TYPES } from "../ports/file-storage.port";
import { TempStoragePromotionPort } from "../ports/temp-storage-promotion.port";
import {
  is_temp_storage_path,
  promote_temp_storage_path,
  split_storage_compound_path,
  to_storage_pathname,
} from "../types/temp-storage-path";
import { guess_image_mimetype_from_object_key } from "../utils/guess-image-mimetype-from-object-key";
import { normalize_image_filename_for_storage } from "../utils/normalize-image-filename-for-storage";

const toMulterFile = (
  buffer: Buffer,
  originalname: string,
  mimetype: string,
): Express.Multer.File =>
  ({
    fieldname: "file",
    originalname,
    encoding: "7bit",
    mimetype,
    buffer,
    size: buffer.length,
    destination: "",
    filename: originalname,
    path: "",
  }) as Express.Multer.File;

const isWebpObjectKey = (objectKey: string): boolean =>
  path.extname(objectKey).toLowerCase() === ".webp";

@Injectable()
export class R2ImageStorageFinalizationAdapter
  extends ImageStorageFinalizationPort
  implements TempStoragePromotionPort
{
  constructor(
    private readonly objectStorageService: ObjectStorageService,
    private readonly optimizeImageService: OptimizeImageService,
  ) {
    super();
  }

  async promote_compound_path(compound_path: string): Promise<string> {
    if (!is_temp_storage_path(compound_path)) {
      throw new TempStoragePathInvalidException(compound_path);
    }

    return this.finalize_compound_path(compound_path);
  }

  async finalize_compound_path(compound_path: string): Promise<string> {
    const normalized = compound_path.trim().replace(/^\/+/, "");
    const promotedCompound = is_temp_storage_path(normalized)
      ? promote_temp_storage_path(normalized)
      : normalized;

    const { directory, object_key: destObjectKey } =
      split_storage_compound_path(promotedCompound);

    if (!is_temp_storage_path(normalized) && isWebpObjectKey(destObjectKey)) {
      return to_storage_pathname(promotedCompound);
    }

    const sourceCompound = is_temp_storage_path(normalized)
      ? normalized
      : promotedCompound;
    const { object_key: sourceObjectKey } =
      split_storage_compound_path(sourceCompound);

    const sourceBuffer = await this.objectStorageService.getObjectBuffer(
      directory,
      sourceObjectKey,
    );

    if (!sourceBuffer) {
      throw new Error(
        `No se encontró la imagen en storage: ${directory}/${sourceObjectKey}`,
      );
    }

    const sourceMimetype = guess_image_mimetype_from_object_key(sourceObjectKey);
    const multerFile = toMulterFile(
      sourceBuffer,
      path.basename(sourceObjectKey),
      sourceMimetype,
    );
    const [optimized] = await this.optimizeImageService.execute([multerFile], {
      diferente_sizes: false,
    });
    const optimizedFilename = normalize_image_filename_for_storage(
      optimized.large.originalname,
      CONTENT_TYPES.IMAGE_WEBP,
    );
    const destDir = path.dirname(destObjectKey);
    const finalObjectKey =
      destDir && destDir !== "."
        ? `${destDir}/${optimizedFilename}`
        : optimizedFilename;

    await this.objectStorageService.putObjectToBucket(
      directory,
      finalObjectKey,
      optimized.large.buffer,
      CONTENT_TYPES.IMAGE_WEBP,
    );

    if (sourceObjectKey !== finalObjectKey) {
      await this.objectStorageService.deleteObjectFromBucket(
        directory,
        sourceObjectKey,
      );
    }

    return to_storage_pathname(`${directory}/${finalObjectKey}`);
  }
}
