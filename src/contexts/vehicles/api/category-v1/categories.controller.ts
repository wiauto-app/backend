import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { CategoriesService } from "../../services/categories.service";
import { V1_CATEGORIES } from "../route.constants";
import { CreateCategoryHttpDto } from "./create-category/create-category.http-dto";
import { UpdateCategoryHttpDto } from "./update-category/update-category.http-dto";

@Controller(V1_CATEGORIES)
export class CategoriesController {
  constructor(private readonly categories_service: CategoriesService) {}

  @Post()
  create(@Body() create_category_http_dto: CreateCategoryHttpDto) {
    return this.categories_service.create(create_category_http_dto);
  }

  @Patch()
  update(@Body() update_category_http_dto: UpdateCategoryHttpDto) {
    return this.categories_service.update(update_category_http_dto);
  }

  @Get()
  findAll(@Query() query: PaginationHttpDto) {
    return this.categories_service.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.categories_service.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.categories_service.remove(id);
  }
}
