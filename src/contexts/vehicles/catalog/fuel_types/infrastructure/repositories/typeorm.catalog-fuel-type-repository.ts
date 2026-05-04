import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CatalogFuelType } from "../../domain/entities/catalog-fuel-type";
import { CatalogFuelTypeNotFoundException } from "../../domain/exceptions/catalog-fuel-type-not-found.exception";
import { CatalogFuelTypesRepository } from "../../domain/repositories/catalog-fuel-types.repository";
import { CatalogFuelTypeEntity } from "../persistence/catalog-fuel-type.entity";

const CATALOG_FUEL_TYPE_SORT_KEYS = new Set([
  "id",
  "fuel_id",
  "name",
  "slug",
  "can_charge",
  "created_at",
]);

export class TypeormCatalogFuelTypeRepository extends CatalogFuelTypesRepository {
  constructor(
    @InjectRepository(CatalogFuelTypeEntity)
    private readonly repo: Repository<CatalogFuelTypeEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<CatalogFuelType>> {
    return run_paginated_typeorm_find({
      repository: this.repo,
      filter,
      map_row: (row) =>
        CatalogFuelType.fromPrimitives({
          id: row.id,
          fuel_id: row.fuel_id,
          name: row.name,
          slug: row.slug,
          can_charge: row.can_charge,
          created_at: row.created_at,
        }),
      allowed_sort_keys: CATALOG_FUEL_TYPE_SORT_KEYS,
      default_sort_key: "id",
    });
  }

  async findOne(id: number): Promise<CatalogFuelType | null> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return CatalogFuelType.fromPrimitives({
      id: row.id,
      fuel_id: row.fuel_id,
      name: row.name,
      slug: row.slug,
      can_charge: row.can_charge,
      created_at: row.created_at,
    });
  }

  async save(row: CatalogFuelType): Promise<CatalogFuelType> {
    const p = row.toPrimitives();
    if (p.id === undefined) {
      const saved = await this.repo.save(
        this.repo.create({
          fuel_id: p.fuel_id,
          name: p.name,
          slug: p.slug,
          can_charge: p.can_charge,
        }),
      );
      return CatalogFuelType.fromPrimitives({
        id: saved.id,
        fuel_id: saved.fuel_id,
        name: saved.name,
        slug: saved.slug,
        can_charge: saved.can_charge,
        created_at: saved.created_at,
      });
    }
    const pre = await this.repo.preload({
      id: p.id,
      fuel_id: p.fuel_id,
      name: p.name,
      slug: p.slug,
      can_charge: p.can_charge,
    });
    if (!pre) {
      throw new CatalogFuelTypeNotFoundException(p.id);
    }
    const saved = await this.repo.save(pre);
    return CatalogFuelType.fromPrimitives({
      id: saved.id,
      fuel_id: saved.fuel_id,
      name: saved.name,
      slug: saved.slug,
      can_charge: saved.can_charge,
      created_at: saved.created_at,
    });
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
