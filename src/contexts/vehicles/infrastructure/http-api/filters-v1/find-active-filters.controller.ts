import { Controller, Get, Query } from "@nestjs/common";
import { V1_FILTERS } from "../route.constants";
import { FindActiveFiltersUseCase } from "../../../application/filters/find-active-filters-use-case/find-active-filters.use-case";
import { FindActiveFiltersHttpDto } from "./find-active-filters.http-dto";

@Controller(V1_FILTERS)
export class FindActiveFiltersController {
  constructor(
    private readonly find_active_filters_use_case: FindActiveFiltersUseCase,
  ) {}

  @Get("active")
  findActiveFilters(@Query() find_active_filters_http_dto: FindActiveFiltersHttpDto) {
    return this.find_active_filters_use_case.execute(find_active_filters_http_dto);
  }
}
