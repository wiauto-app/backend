import { Controller, Get } from "@nestjs/common";
import { V1_FILTERS } from "../route.constants";
import { FindFiltersUseCase } from "../../../application/filters/find-filters-use-case/find-filters.use-case";

@Controller(V1_FILTERS)
export class FindFiltersController {
  constructor(private readonly findFiltersUseCase: FindFiltersUseCase) {}

  @Get()
  findFilters() {
    return this.findFiltersUseCase.execute();
  }
}