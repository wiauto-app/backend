import { Controller, Get, Param } from "@nestjs/common";
import { FindCategoryUseCase } from "@/src/contexts/vehicles/application/category-use-cases/find-category-use-case/find-category.use-case";
import { V1_CATEGORIES } from "../../route.constants";
import { FindCategoryHttpDto } from "./find-category.http-dto";

@Controller(V1_CATEGORIES)
export class FindCategoryController {
  constructor(private readonly find_category_use_case: FindCategoryUseCase) {}

  @Get(":id")
  run(@Param() find_category_http_dto: FindCategoryHttpDto) {
    return this.find_category_use_case.execute(find_category_http_dto);
  }
}
