import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileModule } from "@/src/contexts/shared/file/file.module";
import { CategoryEntity } from "../entities/category.entity";
import { CategoriesController } from "../api/category-v1/categories.controller";
import { CategoriesService } from "../services/categories.service";

@Module({
  controllers: [CategoriesController],
  imports: [TypeOrmModule.forFeature([CategoryEntity]), FileModule],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
