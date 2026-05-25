import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Category } from "../../domain/entities/category";
import { CategoryNotFoundException } from "../../domain/exceptions/category-not-found.exception";
import { CategoryRepository } from "../../domain/repositories/category.repository";
import { CategoryEntity } from "../persistence/category.entity";

const CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "image_url",
  "created_at",
  "updated_at",
]);

export class TypeOrmCategoryRepository extends CategoryRepository {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly category_repository: Repository<CategoryEntity>,
  ) {
    super();
  }

  async findOne(id: string): Promise<Category | null> {
    const row = await this.category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return Category.fromPrimitives(row);
  }

  async find_all(
    filter: CatalogPaginationFilter,
  ): Promise<PaginatedResult<Category>> {
    return runPaginatedTypeormFind({
      repository: this.category_repository,
      filter,
      map_row: (row) => Category.fromPrimitives(row),
      allowed_sort_keys: CATEGORY_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async save(category: Category): Promise<Category> {
    const saved = await this.category_repository.save(category.toPrimitives());
    return Category.fromPrimitives(saved);
  }

  async update(category: Category): Promise<void> {
    const primitive = category.toPrimitives();
    const row = await this.category_repository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
      image_url: primitive.image_url ?? null,
    });
    if (!row) {
      throw new CategoryNotFoundException(primitive.id);
    }
    await this.category_repository.save(row);
  }

  async delete(id: string): Promise<void> {
    await this.category_repository.delete(id);
  }
}
