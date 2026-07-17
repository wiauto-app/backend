import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { FinalizeImageStoragePathService } from "@/src/contexts/shared/file/services/finalize-image-storage-path.service";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveCategory } from "@/src/contexts/vehicles/types/category";
import { CategoryNotFoundException } from "@/src/contexts/vehicles/exceptions/category-not-found.exception";
import { CategoryEntity } from "@/src/contexts/vehicles/entities/category.entity";

const CATEGORY_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "image_url",
  "created_at",
  "updated_at",
]);

export interface CreateCategoryInput {
  name: string;
  image_url?: string | null;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  image_url?: string | null;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly category_repository: Repository<CategoryEntity>,
    private readonly finalize_image_storage_path_service: FinalizeImageStoragePathService,
  ) {}

  async create(input: CreateCategoryInput): Promise<PrimitiveCategory> {
    const name = input.name.trim();
    const image_url = input.image_url
      ? await this.finalize_image_storage_path_service.execute(input.image_url)
      : null;
    const row = this.category_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
      image_url,
    });
    const saved = await this.category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async update(input: UpdateCategoryInput): Promise<PrimitiveCategory> {
    const existing = await this.category_repository.findOne({
      where: { id: input.id },
    });
    if (!existing) {
      throw new CategoryNotFoundException(input.id);
    }

    const next_name =
      input.name === undefined ? existing.name : input.name.trim();
    let next_image_url = existing.image_url ?? null;
    if (input.image_url !== undefined) {
      next_image_url =
        input.image_url === null
          ? null
          : await this.finalize_image_storage_path_service.execute(
              input.image_url,
            );
    }
    const next_slug =
      input.name === undefined || input.name === existing.name
        ? existing.slug
        : slugify(next_name);

    const row = await this.category_repository.preload({
      id: input.id,
      name: next_name,
      slug: next_slug,
      image_url: next_image_url,
    });
    if (!row) {
      throw new CategoryNotFoundException(input.id);
    }

    const saved = await this.category_repository.save(row);
    return this.toPrimitive(saved);
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCategory>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.category_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: CATEGORY_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<PrimitiveCategory> {
    const category = await this.findById(id);
    if (!category) {
      throw new CategoryNotFoundException(id);
    }
    return category;
  }

  async findById(id: string): Promise<PrimitiveCategory | null> {
    const row = await this.category_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.category_repository.delete(id);
  }

  private toPrimitive(row: CategoryEntity): PrimitiveCategory {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      image_url: row.image_url,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
