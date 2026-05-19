import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, Repository } from "typeorm";

import { CatalogVersion } from "../../domain/entities/catalog-version";
import { CatalogVersionNotFoundException } from "../../domain/exceptions/catalog-version-not-found.exception";
import { CatalogVersionsRepository } from "../../domain/repositories/catalog-versions.repository";
import { VersionEntity } from "../persistence/version.entity";

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

export class TypeormCatalogVersionRepository extends CatalogVersionsRepository {
  constructor(
    @InjectRepository(VersionEntity)
    private readonly repo: Repository<VersionEntity>,
  ) {
    super();
  }

  private row_to_domain(row: VersionEntity): CatalogVersion {
    return CatalogVersion.fromPrimitives({
      id: row.id,
      make_id: row.make_id,
      model_id: row.model_id,
      body_type_id: row.body_type_id,
      fuel_type_id: row.fuel_type_id,
      year_id: row.year_id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogVersion>> {
    const extra_filters: FindOptionsWhere<VersionEntity> = {};
    if (filter.model_id != null) {
      extra_filters.model_id = filter.model_id;
    }
    if (filter.fuel_type_id != null) {
      extra_filters.fuel_type_id = filter.fuel_type_id;
    }
    if (filter.year_id != null) {
      extra_filters.year_id = filter.year_id;
    }
    const has_extra = Object.keys(extra_filters).length > 0;

    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      ...(has_extra ? { extra_filters } : {}),
      map_row: (row) => this.row_to_domain(row),
      allowed_sort_keys: CATALOG_VERSION_SORT_KEYS,
      default_sort_key: "id",
    });
  }

  async findOne(id: number): Promise<CatalogVersion | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.row_to_domain(row);
  }

  async save(row: CatalogVersion): Promise<CatalogVersion> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          make_id: p.make_id,
          model_id: p.model_id,
          body_type_id: p.body_type_id,
          fuel_type_id: p.fuel_type_id,
          year_id: p.year_id,
          name: p.name,
          slug: p.slug,
        }),
      );
      return this.row_to_domain(saved);
    }
    const pre = await this.repo.preload({
      id: p.id,
      make_id: p.make_id,
      model_id: p.model_id,
      body_type_id: p.body_type_id,
      fuel_type_id: p.fuel_type_id,
      year_id: p.year_id,
      name: p.name,
      slug: p.slug,
    });
    if (!pre) {
      throw new CatalogVersionNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return this.row_to_domain(saved);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
