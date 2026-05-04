import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Color } from "../../domain/entities/color";
import { ColorsRepository } from "../../domain/repositories/colors.repository";
import { ColorEntity } from "../persistence/color.entity";

const COLOR_SORT_KEYS = new Set([
  "id",
  "name",
  "hex_code",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeormColorRepository extends ColorsRepository {
  constructor(
    @InjectRepository(ColorEntity)
    private readonly color_repository: Repository<ColorEntity>,
  ) {
    super();
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Color>> {
    return run_paginated_typeorm_find({
      repository: this.color_repository,
      filter,
      map_row: (row) => Color.fromPrimitives(row),
      allowed_sort_keys: COLOR_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<Color | null> {
    const row = await this.color_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Color.fromPrimitives(row);
  }

  async save(color: Color): Promise<void> {
    await this.color_repository.save(color.toPrimitives());
  }

  async update(id: string, name: string, hex_code: string): Promise<void> {
    await this.color_repository.update(id, { name, hex_code });
  }

  async remove(id: string): Promise<void> {
    await this.color_repository.delete(id);
  }
}
