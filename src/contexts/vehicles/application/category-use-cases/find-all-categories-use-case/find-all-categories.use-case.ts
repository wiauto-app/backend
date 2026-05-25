import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CatalogPaginationFilter } from "@/src/contexts/shared/domain/filters/catalog-pagination.filter";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

import { PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryRepository } from "../../../domain/repositories/category.repository";

@Injectable()
export class FindAllCategoriesUseCase {
  constructor(private readonly category_repository: CategoryRepository) {}

  async execute(
    query: PaginationHttpDto,
  ): Promise<PaginatedResult<PrimitiveCategory>> {
    const filter = new CatalogPaginationFilter({ ...query });
    const page = await this.category_repository.find_all(filter);
    return page.map((category) => category.toPrimitives());
  }
}
