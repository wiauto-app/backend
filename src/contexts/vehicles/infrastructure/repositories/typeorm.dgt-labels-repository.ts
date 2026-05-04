import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { DgtLabel } from "../../domain/entities/dgt-label";
import { DgtLabelNotFoundException } from "../../domain/exceptions/dgt-label-not-found.exception";
import { DgtLabelsRepository } from "../../domain/repositories/dgt-labels.repository";
import { DgtLabelEntity } from "../persistence/dgt-label.entity";

const DGT_LABEL_SORT_KEYS = new Set([
  "id",
  "name",
  "code",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeormDgtLabelsRepository extends DgtLabelsRepository {
  constructor(
    @InjectRepository(DgtLabelEntity)
    private readonly dgt_label_repository: Repository<DgtLabelEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<DgtLabel>> {
    return run_paginated_typeorm_find({
      repository: this.dgt_label_repository,
      filter,
      map_row: (row) => DgtLabel.fromPrimitives(row),
      allowed_sort_keys: DGT_LABEL_SORT_KEYS,
      default_sort_key: "code",
    });
  }

  async findOne(id: string): Promise<DgtLabel | null> {
    const row = await this.dgt_label_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return DgtLabel.fromPrimitives(row);
  }

  async save(label: DgtLabel): Promise<void> {
    await this.dgt_label_repository.save(label.toPrimitives());
  }

  async persist_updated(label: DgtLabel): Promise<void> {
    const primitive = label.toPrimitives();
    const row = await this.dgt_label_repository.preload({
      id: primitive.id,
      name: primitive.name,
      code: primitive.code,
      description: primitive.description,
      slug: primitive.slug,
    });
    if (!row) {
      throw new DgtLabelNotFoundException(primitive.id);
    }
    await this.dgt_label_repository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.dgt_label_repository.delete(id);
  }
}
