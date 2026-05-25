import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreateCategoryUseCase } from "../application/category-use-cases/create-category-use-case/create-category.use-case";
import { UpdateCategoryUseCase } from "../application/category-use-cases/update-category-use-case/update-category.use-case";
import { FindCategoryUseCase } from "../application/category-use-cases/find-category-use-case/find-category.use-case";
import { FindAllCategoriesUseCase } from "../application/category-use-cases/find-all-categories-use-case/find-all-categories.use-case";
import { DeleteCategoryUseCase } from "../application/category-use-cases/delete-category-use-case/delete-category.use-case";
import { CategoryRepository } from "../domain/repositories/category.repository";
import { CategoryEntity } from "../infrastructure/persistence/category.entity";
import { TypeOrmCategoryRepository } from "../infrastructure/repositories/typeorm.category-repository";
import { CreateCategoryController } from "../infrastructure/http-api/category-v1/create-category/create-category.controller";
import { UpdateCategoryController } from "../infrastructure/http-api/category-v1/update-category/update-category.controller";
import { FindCategoryController } from "../infrastructure/http-api/category-v1/find-category/find-category.controller";
import { FindAllCategoriesController } from "../infrastructure/http-api/category-v1/find-all-categories/find-all-categories.controller";
import { DeleteCategoryController } from "../infrastructure/http-api/category-v1/delete-category/delete-category.controller";

@Module({
  controllers: [
    CreateCategoryController,
    UpdateCategoryController,
    FindCategoryController,
    FindAllCategoriesController,
    DeleteCategoryController,
  ],
  imports: [TypeOrmModule.forFeature([CategoryEntity])],
  providers: [
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    FindCategoryUseCase,
    FindAllCategoriesUseCase,
    DeleteCategoryUseCase,
    TypeOrmCategoryRepository,
    {
      provide: CategoryRepository,
      useExisting: TypeOrmCategoryRepository,
    },
  ],
  exports: [CategoryRepository],
})
export class CategoriesModule {}
