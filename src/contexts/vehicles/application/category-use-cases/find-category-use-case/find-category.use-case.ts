import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryNotFoundException } from "../../../domain/exceptions/category-not-found.exception";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { FindCategoryDto } from "./find-category.dto";

@Injectable()
export class FindCategoryUseCase {
  constructor(private readonly category_repository: CategoryRepository) {}

  async execute(find_category_dto: FindCategoryDto): Promise<PrimitiveCategory> {
    const category = await this.category_repository.findOne(find_category_dto.id);
    if (!category) {
      throw new CategoryNotFoundException(find_category_dto.id);
    }
    return category.toPrimitives();
  }
}
