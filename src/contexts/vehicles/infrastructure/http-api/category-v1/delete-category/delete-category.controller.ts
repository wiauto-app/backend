import { Controller, Delete, Param } from "@nestjs/common";
import { DeleteCategoryUseCase } from "@/src/contexts/vehicles/application/category-use-cases/delete-category-use-case/delete-category.use-case";
import { V1_CATEGORIES } from "../../route.constants";
import { DeleteCategoryHttpDto } from "./delete-category.http-dto";

@Controller(V1_CATEGORIES)
export class DeleteCategoryController {
  constructor(private readonly delete_category_use_case: DeleteCategoryUseCase) {}

  @Delete(":id")
  run(@Param() delete_category_http_dto: DeleteCategoryHttpDto) {
    return this.delete_category_use_case.execute(delete_category_http_dto);
  }
}
