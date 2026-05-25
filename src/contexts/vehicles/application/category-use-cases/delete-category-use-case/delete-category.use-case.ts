import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { DeleteCategoryDto } from "./delete-category.dto";

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly category_repository: CategoryRepository) {}

  async execute(delete_category_dto: DeleteCategoryDto): Promise<void> {
    await this.category_repository.delete(delete_category_dto.id);
  }
}
