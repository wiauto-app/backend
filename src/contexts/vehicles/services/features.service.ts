import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/types/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/types/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { runPaginatedTypeormFind } from "@/src/contexts/shared/typeorm/run-paginated-typeorm-find";
import { slugify } from "@/src/contexts/shared/slugify-string/slugify";
import { uuidv4 } from "@/src/contexts/shared/uuid-generator/uuid-generator";
import { PrimitiveFeature } from "@/src/contexts/vehicles/types/features";
import { FeatureNotFoundException } from "@/src/contexts/vehicles/exceptions/feature-not-found.exception";
import { FeaturesEntity } from "@/src/contexts/vehicles/entities/features.entity";

const FEATURE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export interface CreateFeatureInput {
  name: string;
}

export interface UpdateFeatureInput {
  id: string;
  name: string;
}

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeaturesEntity)
    private readonly feature_repository: Repository<FeaturesEntity>,
  ) {}

  async create(input: CreateFeatureInput): Promise<PrimitiveFeature> {
    const name = input.name.trim();
    const row = this.feature_repository.create({
      id: uuidv4(),
      name,
      slug: slugify(name),
    });
    const saved = await this.feature_repository.save(row);
    return this.toPrimitive(saved);
  }

  async update(input: UpdateFeatureInput): Promise<PrimitiveFeature> {
    const existing = await this.feature_repository.findOne({
      where: { id: input.id },
    });
    if (!existing) {
      throw new FeatureNotFoundException(input.id);
    }

    const next_name = input.name.trim();
    const row = await this.feature_repository.preload({
      id: input.id,
      name: next_name,
      slug: slugify(next_name),
    });
    if (!row) {
      throw new FeatureNotFoundException(input.id);
    }

    const saved = await this.feature_repository.save(row);
    return this.toPrimitive(saved);
  }

  async findAll(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveFeature>> {
    const filter = new CatalogPaginationFilter({ ...query });
    return runPaginatedTypeormFind({
      repository: this.feature_repository,
      filter,
      map_row: (row) => this.toPrimitive(row),
      allowed_sort_keys: FEATURE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async findOne(id: string): Promise<PrimitiveFeature> {
    const feature = await this.findById(id);
    if (!feature) {
      throw new FeatureNotFoundException(id);
    }
    return feature;
  }

  async findById(id: string): Promise<PrimitiveFeature | null> {
    const row = await this.feature_repository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.toPrimitive(row);
  }

  async remove(id: string): Promise<void> {
    await this.feature_repository.delete(id);
  }

  private toPrimitive(row: FeaturesEntity): PrimitiveFeature {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
