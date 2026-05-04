import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { WarrantyType } from "../../domain/entities/warranty-type";
import { WarrantyTypeNotFoundException } from "../../domain/exceptions/warranty-type-not-found.exception";
import { WarrantyTypesRepository } from "../../domain/repositories/warranty-types.repository";
import { WarrantyTypeEntity } from "../persistence/warranty-type.entity";

const WARRANTY_TYPE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeormWarrantyTypesRepository extends WarrantyTypesRepository {
  constructor(
    @InjectRepository(WarrantyTypeEntity)
    private readonly warranty_type_repository: Repository<WarrantyTypeEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<WarrantyType>> {
    return run_paginated_typeorm_find({
      repository: this.warranty_type_repository,
      filter,
      map_row: (row) => WarrantyType.fromPrimitives(row),
      allowed_sort_keys: WARRANTY_TYPE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<WarrantyType | null> {
    const row = await this.warranty_type_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return WarrantyType.fromPrimitives(row);
  }

  async save(warranty_type: WarrantyType): Promise<void> {
    await this.warranty_type_repository.save(warranty_type.toPrimitives());
  }

  async persist_updated(warranty_type: WarrantyType): Promise<void> {
    const primitive = warranty_type.toPrimitives();
    const row = await this.warranty_type_repository.preload({
      id: primitive.id,
      name: primitive.name,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new WarrantyTypeNotFoundException(primitive.id);
    }
    await this.warranty_type_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.warranty_type_repository.delete(id);
  }
}
