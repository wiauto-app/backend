import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Traction } from "../../domain/entities/traction";
import { TractionNotFoundException } from "../../domain/exceptions/traction-not-found.exception";
import { TractionsRepository } from "../../domain/repositories/tractions.repository";
import { TractionEntity } from "../persistence/traction.entity";

const TRACTION_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeormTractionRepository extends TractionsRepository {
  constructor(
    @InjectRepository(TractionEntity)
    private readonly traction_repository: Repository<TractionEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Traction>> {
    return run_paginated_typeorm_find({
      repository: this.traction_repository,
      filter,
      map_row: (row) => Traction.fromPrimitives(row),
      allowed_sort_keys: TRACTION_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<Traction | null> {
    const row = await this.traction_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Traction.fromPrimitives(row);
  }

  async save(traction: Traction): Promise<void> {
    await this.traction_repository.save(traction.toPrimitives());
  }

  async persist_updated(traction: Traction): Promise<void> {
    const primitive = traction.toPrimitives();
    const row = await this.traction_repository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
    });
    if (!row) {
      throw new TractionNotFoundException(primitive.id);
    }
    await this.traction_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.traction_repository.delete(id);
  }
}
