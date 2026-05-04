import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { run_paginated_typeorm_find } from "@/src/contexts/shared/infrastructure/typeorm/run-paginated-typeorm-find";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Feature } from "../../domain/entities/features";
import { FeatureNotFoundException } from "../../domain/exceptions/feature-not-found.exception";
import { FeatureRepository } from "../../domain/repositories/feature.repository";
import { FeaturesEntity } from "../persistence/features.entity";

const FEATURE_SORT_KEYS = new Set([
  "id",
  "name",
  "slug",
  "created_at",
  "updated_at",
]);

export class TypeOrmFeatureRepository extends FeatureRepository {
  constructor(
    @InjectRepository(FeaturesEntity)
    private readonly featureRepository: Repository<FeaturesEntity>,
  ) {
    super();
  }

  private feature_row_to_domain(row: FeaturesEntity): Feature {
    return Feature.fromPrimitives({
      id: row.id,
      name: row.name,
      slug: row.slug,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  async findOne(id: string): Promise<Feature | null> {
    const row = await this.featureRepository.findOne({ where: { id } });
    if (!row) {
      return null;
    }
    return this.feature_row_to_domain(row);
  }

  async find_all(filter: CatalogPaginationFilter): Promise<PaginatedResult<Feature>> {
    return run_paginated_typeorm_find({
      repository: this.featureRepository,
      filter,
      map_row: (row) => this.feature_row_to_domain(row),
      allowed_sort_keys: FEATURE_SORT_KEYS,
      default_sort_key: "created_at",
    });
  }

  async save(feature: Feature): Promise<void> {
    await this.featureRepository.save(feature.toPrimitives());
  }

  async persist_updated(feature: Feature): Promise<void> {
    const primitive = feature.toPrimitives();
    const row = await this.featureRepository.preload({
      id: primitive.id,
      name: primitive.name,
      slug: primitive.slug,
    });
    if (!row) {
      throw new FeatureNotFoundException(primitive.id);
    }
    await this.featureRepository.save(row);
  }

  async remove(id: string): Promise<void> {
    await this.featureRepository.delete(id);
  }
}