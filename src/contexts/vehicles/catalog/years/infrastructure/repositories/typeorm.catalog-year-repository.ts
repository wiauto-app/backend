import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { CatalogYear } from "../../domain/entities/catalog-year";
import { CatalogYearNotFoundException } from "../../domain/exceptions/catalog-year-not-found.exception";
import { CatalogYearsRepository } from "../../domain/repositories/catalog-years.repository";
import { CatalogYearEntity } from "../persistence/catalog-year.entity";
import { VersionEntity } from "../../../versions/infrastructure/persistence/version.entity";

const CATALOG_YEAR_SORT_KEYS = new Set(["id", "year", "slug", "created_at"]);

export class TypeormCatalogYearRepository extends CatalogYearsRepository {
  constructor(
    @InjectRepository(CatalogYearEntity)
    private readonly repo: Repository<CatalogYearEntity>,
    @InjectRepository(VersionEntity)
    private readonly versionRepo: Repository<VersionEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogYear>> {
    const yearIds: number[] = [];
    if (filter.model_id) {
      const qb = this.versionRepo
        .createQueryBuilder("version")
        .distinctOn(["year_id"]);

      qb.andWhere("version.model_id = :model_id", { model_id: filter.model_id });
      if (filter.body_type_id != null) {
        qb.andWhere("version.body_type_id = :body_type_id", {
          body_type_id: filter.body_type_id,
        });
      }
      const versions = await qb.getMany();
      yearIds.push(...versions.map((v) => v.year_id));
    }
    return runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      ...(yearIds.length > 0 ? { extra_filters: { id: In(yearIds) } } : {}),
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
