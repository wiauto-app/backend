import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { ImageStorageFinalizationPort } from "../../domain/ports/image-storage-finalization.port";

@Injectable()
export class FinalizeImageStoragePathUseCase {
  constructor(
    private readonly image_storage_finalization_port: ImageStorageFinalizationPort,
  ) {}

  async execute(
    storage_path: string | null | undefined,
  ): Promise<string | null> {
    if (!storage_path?.trim()) {
      return null;
    }

    return this.image_storage_finalization_port.finalize_compound_path(
      storage_path.trim(),
    );
  }
}
