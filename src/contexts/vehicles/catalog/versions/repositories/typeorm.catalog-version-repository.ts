import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";

import { CatalogVersionNotFoundException } from "../exceptions/catalog-version-not-found.exception";
import { VersionEntity } from "../entities/version.entity";

const CATALOG_VERSION_SORT_KEYS = new Set([
  "id",
  "make_id",
  "model_id",
  "body_type_id",
  "fuel_type_id",
  "year_id",
  "name",
  "slug",
  "created_at",
]);

@Injectable()
export class TypeormCatalogVersionRepository {
  constructor(
    @InjectRepository(VersionEntity)
    private readonly repo: Repository<VersionEntity>,
  ) {}

  async findAll(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<VersionEntity>> {
    const extraFilters: FindOptionsWhere<VersionEntity> = {};

    if (filter.make_id != null) {
      extraFilters.make_id = filter.make_id;
    }
    if (filter.body_type_id != null) {
      extraFilters.body_type_id = filter.body_type_id;
    }
    if (filter.model_id != null) {
      extraFilters.model_id = filter.model_id;
    }
    if (filter.fuel_type_id != null) {
      extraFilters.fuel_type_id = filter.fuel_type_id;
    }
    if (filter.year_id != null) {
      extraFilters.year_id = filter.year_id;
    }
    const hasExtra = Object.keys(extraFilters).length > 0;

    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      ...(hasExtra ? { extra_filters: extraFilters } : {}),
      allowed_sort_keys: CATALOG_VERSION_SORT_KEYS,
      default_sort_key: "id",
      relations: ["year"],
    });
  }

  async findOne(id: number): Promise<VersionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async save(row: VersionEntity): Promise<VersionEntity> {
    if (!row.id) {
      return this.repo.save(
        this.repo.create({
          version_id: row.version_id ?? null,
          make_id: row.make_id,
          model_id: row.model_id,
          body_type_id: row.body_type_id,
          fuel_type_id: row.fuel_type_id,
          year_id: row.year_id,
          name: row.name,
          slug: row.slug,
        }),
      );
    }

    const preloaded = await this.repo.preload({
      id: row.id,
      version_id: row.version_id,
      make_id: row.make_id,
      model_id: row.model_id,
      body_type_id: row.body_type_id,
      fuel_type_id: row.fuel_type_id,
      year_id: row.year_id,
      name: row.name,
      slug: row.slug,
    });
    if (!preloaded) {
      throw new CatalogVersionNotFoundException(row.id);
    }
    return this.repo.save(preloaded);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
