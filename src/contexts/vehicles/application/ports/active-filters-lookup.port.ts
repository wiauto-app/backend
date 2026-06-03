import { FindActiveFiltersDto } from "../filters/find-active-filters-use-case/find-active-filters.dto";
import { ActiveFiltersResolved } from "../../domain/read-models/active-filters-response";

export abstract class ActiveFiltersLookupPort {
  abstract resolveResolved(
    find_active_filters_dto: FindActiveFiltersDto,
  ): Promise<ActiveFiltersResolved>;
}
