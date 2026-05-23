import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TempStoragePromotionPort } from "../../domain/ports/temp-storage-promotion.port";
import { PromoteTempStoragePathsDto } from "./promote-temp-storage-paths.dto";

@Injectable()
export class PromoteTempStoragePathsUseCase {
  constructor(
    private readonly temp_storage_promotion_port: TempStoragePromotionPort,
  ) {}

  async execute(
    dto: PromoteTempStoragePathsDto,
  ): Promise<{ pathnames: string[] }> {
    const pathnames: string[] = [];

    for (const path of dto.paths) {
      const pathname =
        await this.temp_storage_promotion_port.promote_compound_path(path);
      pathnames.push(pathname);
    }

    return { pathnames };
  }
}
