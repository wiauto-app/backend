import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryNotFoundException } from "../../../domain/exceptions/category-not-found.exception";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { UpdateCategoryDto } from "./update-category.dto";

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly category_repository: CategoryRepository) {}

  async execute(update_category_dto: UpdateCategoryDto): Promise<PrimitiveCategory> {
    const category = await this.category_repository.findOne(update_category_dto.id);
    if (!category) {
      throw new CategoryNotFoundException(update_category_dto.id);
    }
    const updated_category = category.update({
      name: update_category_dto.name,
      image_url: update_category_dto.image_url,
    });
    await this.category_repository.update(updated_category);
    return updated_category.toPrimitives();
  }
}
