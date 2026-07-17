import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { CatalogBodyType } from "../types/catalog-body-type";
import { CatalogBodyTypeNotFoundException } from "../exceptions/catalog-body-type-not-found.exception";
import { CatalogBodyTypeEntity } from "../entities/catalog-body-type.entity";
import { VersionEntity } from "../../versions/entities/version.entity";

const CATALOG_BODY_TYPE_SORT_KEYS = new Set([
  "id",
  "body_type_id",
  "doors",
  "name",
  "slug",
  "created_at",
]);

@Injectable()
export class TypeormCatalogBodyTypeRepository {
  constructor(
    @InjectRepository(CatalogBodyTypeEntity)
    private readonly repo: Repository<CatalogBodyTypeEntity>,
    @InjectRepository(VersionEntity)
    private readonly versionRepo: Repository<VersionEntity>,
  ) {}

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogBodyType>> {
    const bodyTypeIds: number[] = [];
    if (filter.model_id) {
      const qb = this.versionRepo.createQueryBuilder("version")
        .distinctOn(["body_type_id"])

      if (filter.model_id) {
        qb.andWhere("version.model_id = :model_id", { model_id: filter.model_id });
      }
      const versions = await qb.getMany();
      bodyTypeIds.push(...versions.map((v) => v.body_type_id));
    }
    const bodyTypes = runPaginatedTypeormFind({
      repository: this.repo,
      filter,
      ...(bodyTypeIds.length > 0 ? { extra_filters: { id: In(bodyTypeIds) } } : {}),
      map_row: (row) => CatalogBodyType.fromPrimitives(row),
      allowed_sort_keys: CATALOG_BODY_TYPE_SORT_KEYS,
      default_sort_key: "id",
    });
    return bodyTypes;
  }

  async findOne(id: number): Promise<CatalogBodyType | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogBodyType.fromPrimitives({
      id: row.id,
      body_type_id: row.body_type_id,
      doors: row.doors,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(row: CatalogBodyType): Promise<CatalogBodyType> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          body_type_id: p.body_type_id,
          doors: p.doors,
          name: p.name,
          slug: p.slug,
        }),
      );
      return CatalogBodyType.fromPrimitives({
        id: saved.id,
        body_type_id: saved.body_type_id,
        doors: saved.doors,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const pre = await this.repo.preload({
      id: p.id,
      body_type_id: p.body_type_id,
      doors: p.doors,
      name: p.name,
      slug: p.slug,
    });
    if (!pre) {
      throw new CatalogBodyTypeNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return CatalogBodyType.fromPrimitives({
      id: saved.id,
      body_type_id: saved.body_type_id,
      doors: saved.doors,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
