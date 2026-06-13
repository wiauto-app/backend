import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { FinalizeImageStoragePathUseCase } from "@/src/contexts/shared/file/application/finalize-image-storage-path-use-case/finalize-image-storage-path.use-case";
import { Category, PrimitiveCategory } from "../../../domain/entities/category";
import { CategoryRepository } from "../../../domain/repositories/category.repository";
import { CreateCategoryDto } from "./create-category.dto";

@Injectable()
export class CreateCategoryUseCase {
  constructor(
    private readonly category_repository: CategoryRepository,
    private readonly finalize_image_storage_path_use_case: FinalizeImageStoragePathUseCase,
  ) { }

  async execute(create_category_dto: CreateCategoryDto): Promise<PrimitiveCategory> {
    const image_url = create_category_dto.image_url
      ? await this.finalize_image_storage_path_use_case.execute(
        create_category_dto.image_url,
      )
      : null;
    const category = Category.create({
      name: create_category_dto.name,
      image_url,
    });
    await this.category_repository.save(category);
    return category.toPrimitives();
  }
}