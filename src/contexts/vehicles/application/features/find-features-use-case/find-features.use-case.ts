import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { FeatureRepository } from "../../../domain/repositories/feature.repository";
import { PrimitiveFeature } from "../../../domain/entities/features";
import { FindFeaturesUseCaseDto } from "./find-features.dto";

@Injectable()
export class FindFeaturesUseCase {
  constructor(private readonly featureRepository: FeatureRepository) {}

  async execute(
    findFeaturesDto: FindFeaturesUseCaseDto,
  ): Promise<PaginatedResult<PrimitiveFeature>> {
    const filter = new CatalogPaginationFilter({ ...findFeaturesDto });
    const page = await this.featureRepository.find_all(filter);
    return page.map((feature) => feature.toPrimitives());
  }
}