import { Body, Controller, Patch } from "@nestjs/common";
import { UpdateCategoryUseCase } from "@/src/contexts/vehicles/application/category-use-cases/update-category-use-case/update-category.use-case";
import { V1_CATEGORIES } from "../../route.constants";
import { UpdateCategoryHttpDto } from "./update-category.http-dto";

@Controller(V1_CATEGORIES)
export class UpdateCategoryController {
  constructor(private readonly update_category_use_case: UpdateCategoryUseCase) {}

  @Patch()
  run(@Body() update_category_http_dto: UpdateCategoryHttpDto) {
    return this.update_category_use_case.execute(update_category_http_dto);
  }
}
