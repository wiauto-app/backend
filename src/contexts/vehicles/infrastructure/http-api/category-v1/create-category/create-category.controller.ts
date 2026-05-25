import { Body, Controller, Post } from "@nestjs/common";
import { CreateCategoryUseCase } from "@/src/contexts/vehicles/application/category-use-cases/create-category-use-case/create-category.use-case";
import { V1_CATEGORIES } from "../../route.constants";
import { CreateCategoryHttpDto } from "./create-category.http-dto";

@Controller(V1_CATEGORIES)
export class CreateCategoryController {
  constructor(private readonly create_category_use_case: CreateCategoryUseCase) {}

  @Post()
  run(@Body() create_category_http_dto: CreateCategoryHttpDto) {
    return this.create_category_use_case.execute(create_category_http_dto);
  }
}
