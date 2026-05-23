import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { MinioService } from "@/src/contexts/shared/minio-provider/minio.service";

import { TempStoragePathInvalidException } from "../../domain/exceptions/temp-storage-path-invalid.exception";
import { TempStoragePromotionPort } from "../../domain/ports/temp-storage-promotion.port";
import {
  is_temp_storage_path,
  promote_temp_storage_path,
  split_storage_compound_path,
  to_storage_pathname,
} from "../../domain/temp-storage-path";

@Injectable()
export class MinioTempStoragePromotionAdapter extends TempStoragePromotionPort {
  constructor(private readonly minio_service: MinioService) {
    super();
  }

  async promote_compound_path(compound_path: string): Promise<string> {
    if (!is_temp_storage_path(compound_path)) {
      throw new TempStoragePathInvalidException(compound_path);
    }

    const promoted_compound = promote_temp_storage_path(compound_path);
    const { bucket_name, object_key: source_object_key } =
      split_storage_compound_path(compound_path);
    const { object_key: dest_object_key } = split_storage_compound_path(
      promoted_compound,
    );

    await this.minio_service.copyObjectInBucket(
      bucket_name,
      source_object_key,
      dest_object_key,
    );
    await this.minio_service.deleteObjectFromBucket(
      bucket_name,
      source_object_key,
    );

    return to_storage_pathname(promoted_compound);
  }
}
