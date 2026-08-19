import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ObjectStorageService } from "@/src/contexts/shared/object-storage/object-storage.service";

import { TempStoragePathInvalidException } from "../exceptions/temp-storage-path-invalid.exception";
import { ImageStorageFinalizationPort } from "../ports/image-storage-finalization.port";
import { TempStoragePromotionPort } from "../ports/temp-storage-promotion.port";
import {
  is_temp_storage_path,
  promote_temp_storage_path,
  split_storage_compound_path,
  to_storage_pathname,
} from "../types/temp-storage-path";

@Injectable()
export class R2ImageStorageFinalizationAdapter
  extends ImageStorageFinalizationPort
  implements TempStoragePromotionPort
{
  constructor(
    private readonly objectStorageService: ObjectStorageService,
  ) {
    super();
  }

  async promote_compound_path(compound_path: string): Promise<string> {
    if (!is_temp_storage_path(compound_path)) {
      throw new TempStoragePathInvalidException(compound_path);
    }

    return this.finalize_compound_path(compound_path);
  }

  async restore_temp_compound_path(
    temp_compound_path: string,
  ): Promise<string> {
    if (!is_temp_storage_path(temp_compound_path)) {
      throw new TempStoragePathInvalidException(temp_compound_path);
    }

    const normalized_temp_path = temp_compound_path.trim().replace(/^\/+/, "");
    const promoted_path = promote_temp_storage_path(normalized_temp_path);
    const {
      directory,
      object_key: temp_object_key,
    } = split_storage_compound_path(normalized_temp_path);
    const {
      directory: promoted_directory,
      object_key: promoted_object_key,
    } = split_storage_compound_path(promoted_path);

    if (directory !== promoted_directory) {
      throw new TempStoragePathInvalidException(temp_compound_path);
    }

    await this.objectStorageService.copyObjectInBucket(
      directory,
      promoted_object_key,
      temp_object_key,
    );
    await this.objectStorageService.deleteObjectFromBucket(
      directory,
      promoted_object_key,
    );

    return to_storage_pathname(normalized_temp_path);
  }

  async finalize_compound_path(compound_path: string): Promise<string> {
    const normalized = compound_path.trim().replace(/^\/+/, "");

    const promotedCompound = is_temp_storage_path(normalized)
      ? promote_temp_storage_path(normalized)
      : normalized;

    const {
      directory,
      object_key: destObjectKey,
    } = split_storage_compound_path(promotedCompound);

    const sourceCompound = is_temp_storage_path(normalized)
      ? normalized
      : promotedCompound;

    const {
      object_key: sourceObjectKey,
    } = split_storage_compound_path(sourceCompound);

    // Ya está en la ubicación definitiva.
    if (sourceObjectKey === destObjectKey) {
      return to_storage_pathname(promotedCompound);
    }

    // Copia directamente dentro de R2.
    // La imagen NO pasa por NestJS.
    await this.objectStorageService.copyObjectInBucket(
      directory,
      sourceObjectKey,
      destObjectKey,
    );

    // Una vez confirmada la copia, eliminamos el temporal.
    await this.objectStorageService.deleteObjectFromBucket(
      directory,
      sourceObjectKey,
    );

    return to_storage_pathname(promotedCompound);
  }
}
