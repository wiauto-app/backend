import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { FindOptionsWhere, In, Repository } from "typeorm";

import { CatalogYear } from "../types/catalog-year";
import { CatalogYearNotFoundException } from "../exceptions/catalog-year-not-found.exception";
import { CatalogYearEntity } from "../entities/catalog-year.entity";
import { VersionEntity } from "../../versions/entities/version.entity";
import { VersionYearEntity } from "../../versions/entities/version-year.entity";

const CATALOG_YEAR_SORT_KEYS = new Set(["id", "year", "slug", "created_at"]);

@Injectable()
export class TypeormCatalogYearRepository {
  constructor(
    @InjectRepository(CatalogYearEntity)
    private readonly repo: Repository<CatalogYearEntity>,
    @InjectRepository(VersionYearEntity)
    private readonly versionYearRepo: Repository<VersionYearEntity>,
  ) {}

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogYear>> {
    let extra_filters: FindOptionsWhere<CatalogYearEntity> | undefined;
    if (filter.model_id) {
      const year_ids = await this.findYearIdsByVersionFilter(filter);
      if (year_ids.length === 0) {
        // Modelo sin versiones (o sin versiones con esa carrocería/combustible).
        return new PaginatedResult<CatalogYear>([], 0, filter.page, filter.limit);
      }
      extra_filters = { id: In(year_ids) };
    }
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      ...(extra_filters ? { extra_filters } : {}),
      map_row: (row) =>
        CatalogYear.fromPrimitives({
          id: row.id,
          year: row.year,
          slug: row.slug,
          created_at: row.created_at,
        }),
      allowed_sort_keys: CATALOG_YEAR_SORT_KEYS,
      default_sort_key: "year",
      search_column: "slug",
    });
  }

  /** Años en los que existe alguna versión del modelo (`version_year`). */
  private async findYearIdsByVersionFilter(
    filter: CatalogPaginationFilter,
  ): Promise<number[]> {
    const qb = this.versionYearRepo
      .createQueryBuilder("vy")
      .innerJoin(VersionEntity, "version", "version.id = vy.version_id")
      .select("DISTINCT vy.year_id", "year_id")
      .where("version.model_id = :model_id", { model_id: filter.model_id });

    if (filter.body_type_id != null) {
      qb.andWhere("version.body_type_id = :body_type_id", {
        body_type_id: filter.body_type_id,
      });
    }
    if (filter.fuel_type_id != null) {
      qb.andWhere("version.fuel_type_id = :fuel_type_id", {
        fuel_type_id: filter.fuel_type_id,
      });
    }

    const rows = await qb.getRawMany<{ year_id: number | string }>();
    return rows.map((row) => Number(row.year_id));
  }

  async findOne(id: number): Promise<CatalogYear | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogYear.fromPrimitives({
      id: row.id,
      year: row.year,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(year: CatalogYear): Promise<CatalogYear> {
    const p = year.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({ year: p.year, slug: p.slug }),
      );
      return CatalogYear.fromPrimitives({
        id: saved.id,
        year: saved.year,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const row = await this.repo.preload({ id: p.id, year: p.year, slug: p.slug });
    if (!row) {
      throw new CatalogYearNotFoundException(p.id);
    }
    const saved = await this.repo.save(row);
    return CatalogYear.fromPrimitives({
      id: saved.id,
      year: saved.year,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
