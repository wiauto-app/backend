import { Controller, Get, Query } from "@nestjs/common";
import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { FindAllCategoriesUseCase } from "@/src/contexts/vehicles/application/category-use-cases/find-all-categories-use-case/find-all-categories.use-case";
import { V1_CATEGORIES } from "../../route.constants";

@Controller(V1_CATEGORIES)
export class FindAllCategoriesController {
  constructor(
    private readonly find_all_categories_use_case: FindAllCategoriesUseCase,
  ) {}

  @Get()
  run(@Query() query: PaginationHttpDto) {
    return this.find_all_categories_use_case.execute(query);
  }
}
