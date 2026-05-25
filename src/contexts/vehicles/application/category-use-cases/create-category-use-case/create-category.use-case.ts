import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { Category, PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { CreateCategoryDto } from "./create-category.dto";

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly category_repository: CategoryRepository) { }

  async execute(create_category_dto: CreateCategoryDto): Promise<PrimitiveCategory> {
    const category = Category.create(create_category_dto);
    await this.category_repository.save(category);
    return category.toPrimitives();
  }
}