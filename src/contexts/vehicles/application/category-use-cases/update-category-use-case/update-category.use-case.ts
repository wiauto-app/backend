import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FinalizeImageStoragePathUseCase } from "@/src/contexts/shared/file/application/finalize-image-storage-path-use-case/finalize-image-storage-path.use-case";
import { PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryNotFoundException } from "../../../domain/exceptions/category-not-found.exception";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { UpdateCategoryDto } from "./update-category.dto";

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    private readonly category_repository: CategoryRepository,
    private readonly finalize_image_storage_path_use_case: FinalizeImageStoragePathUseCase,
  ) {}

  async execute(update_category_dto: UpdateCategoryDto): Promise<PrimitiveCategory> {
    const category = await this.category_repository.findOne(update_category_dto.id);
    if (!category) {
      throw new CategoryNotFoundException(update_category_dto.id);
    }

    let image_url = update_category_dto.image_url;
    if (image_url !== undefined && image_url !== null) {
      image_url = await this.finalize_image_storage_path_use_case.execute(image_url);
    }

    const updated_category = category.update({
      name: update_category_dto.name,
      image_url,
    });
    await this.category_repository.update(updated_category);
    return updated_category.toPrimitives();
  }
}
