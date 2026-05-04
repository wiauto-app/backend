import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CatalogModel } from "../../domain/entities/catalog-model";
import { CatalogModelNotFoundException } from "../../domain/exceptions/catalog-model-not-found.exception";
import { CatalogModelsRepository } from "../../domain/repositories/catalog-models.repository";
import { CatalogModelEntity } from "../persistence/catalog-model.entity";

const CATALOG_MODEL_SORT_KEYS = new Set([
  "id",
  "make_id",
  "model_id",
  "name",
  "slug",
  "created_at",
]);

export class TypeormCatalogModelRepository extends CatalogModelsRepository {
  constructor(
    @InjectRepository(CatalogModelEntity)
    private readonly repo: Repository<CatalogModelEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogModel>> {
    return run_paginated_typeorm_find({
      repository: this.repo,
      filter,
      map_row: (row) =>
        CatalogModel.fromPrimitives({
          id: row.id,
          make_id: row.make_id,
          model_id: row.model_id,
          name: row.name,
          slug: row.slug,
          created_at: row.created_at,
        }),
      allowed_sort_keys: CATALOG_MODEL_SORT_KEYS,
      default_sort_key: "id",
    });
  }

  async findOne(id: number): Promise<CatalogModel | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogModel.fromPrimitives({
      id: row.id,
      make_id: row.make_id,
      model_id: row.model_id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
    });
  }

  async save(row: CatalogModel): Promise<CatalogModel> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          make_id: p.make_id,
          model_id: p.model_id,
          name: p.name,
          slug: p.slug,
        }),
      );
      return CatalogModel.fromPrimitives({
        id: saved.id,
        make_id: saved.make_id,
        model_id: saved.model_id,
        name: saved.name,
        slug: saved.slug,
        created_at: saved.created_at,
      });
    }
    const pre = await this.repo.preload({
      id: p.id,
      make_id: p.make_id,
      model_id: p.model_id,
      name: p.name,
      slug: p.slug,
    });
    if (!pre) {
      throw new CatalogModelNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return CatalogModel.fromPrimitives({
      id: saved.id,
      make_id: saved.make_id,
      model_id: saved.model_id,
      name: saved.name,
      slug: saved.slug,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
