import path from "node:path";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";

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

const to_multer_file = (
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

const is_webp_object_key = (object_key: string): boolean =>
  path.extname(object_key).toLowerCase() === ".webp";

@Injectable()
export class MinioImageStorageFinalizationAdapter
  extends ImageStorageFinalizationPort
  implements TempStoragePromotionPort
{
  constructor(
    private readonly minio_service: MinioService,
    private readonly optimize_image_service: OptimizeImageService,
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
    const promoted_compound = is_temp_storage_path(normalized)
      ? promote_temp_storage_path(normalized)
      : normalized;

    const { bucket_name, object_key: dest_object_key } =
      split_storage_compound_path(promoted_compound);

    if (!is_temp_storage_path(normalized) && is_webp_object_key(dest_object_key)) {
      return to_storage_pathname(promoted_compound);
    }

    const source_compound = is_temp_storage_path(normalized)
      ? normalized
      : promoted_compound;
    const { object_key: source_object_key } =
      split_storage_compound_path(source_compound);

    const source_buffer = await this.minio_service.getObjectBuffer(
      bucket_name,
      source_object_key,
    );

    if (!source_buffer) {
      throw new Error(
        `No se encontró la imagen en storage: ${bucket_name}/${source_object_key}`,
      );
    }

    const source_mimetype = guess_image_mimetype_from_object_key(source_object_key);
    const multer_file = to_multer_file(
      source_buffer,
      path.basename(source_object_key),
      source_mimetype,
    );
    const [optimized] = await this.optimize_image_service.execute([multer_file], {
      diferente_sizes: false,
    });
    const optimized_filename = normalize_image_filename_for_storage(
      optimized.large.originalname,
      CONTENT_TYPES.IMAGE_WEBP,
    );
    const dest_dir = path.dirname(dest_object_key);
    const final_object_key =
      dest_dir && dest_dir !== "."
        ? `${dest_dir}/${optimized_filename}`
        : optimized_filename;

    await this.minio_service.putObjectToBucket(
      bucket_name,
      final_object_key,
      optimized.large.buffer,
      CONTENT_TYPES.IMAGE_WEBP,
    );

    if (source_object_key !== final_object_key) {
      await this.minio_service.deleteObjectFromBucket(
        bucket_name,
        source_object_key,
      );
    }

    return to_storage_pathname(`${bucket_name}/${final_object_key}`);
  }
}
