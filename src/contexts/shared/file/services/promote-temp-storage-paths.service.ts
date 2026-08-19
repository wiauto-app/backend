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
    const promoted_source_paths: string[] = [];

    try {
      for (const path of dto.paths) {
        const pathname =
          await this.temp_storage_promotion_port.promote_compound_path(path);
        pathnames.push(pathname);
        promoted_source_paths.push(path);
      }
    } catch (error) {
      try {
        await this.rollback({ paths: promoted_source_paths });
      } catch (rollback_error) {
        throw new AggregateError(
          [error, rollback_error],
          "Falló la promoción de archivos y su rollback parcial",
        );
      }

      throw error;
    }

    return { pathnames };
  }

  async rollback(dto: PromoteTempStoragePathsDto): Promise<void> {
    const results = await Promise.allSettled(
      [...dto.paths]
        .reverse()
        .map((path) =>
          this.temp_storage_promotion_port.restore_temp_compound_path(path),
        ),
    );
    const failures = results
      .filter((result) => result.status === "rejected")
      .map((result) => result.reason);

    if (failures.length > 0) {
      throw new AggregateError(
        failures,
        "No se pudieron devolver todos los archivos a almacenamiento temporal",
      );
    }
  }
}
