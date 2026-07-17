import { FindActiveFiltersDto } from "../dto/find-active-filters.dto";
import { ActiveFiltersResolved } from "../types/active-filters-response";

export abstract class ActiveFiltersLookupPort {
  abstract resolveResolved(
    find_active_filters_dto: FindActiveFiltersDto,
  ): Promise<ActiveFiltersResolved>;
}
