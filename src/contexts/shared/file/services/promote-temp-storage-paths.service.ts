import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TempStoragePromotionPort } from "../ports/temp-storage-promotion.port";
import { PromoteTempStoragePathsDto } from "../dto/promote-temp-storage-paths.dto";

@Injectable()
export class PromoteTempStoragePathsService {
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
