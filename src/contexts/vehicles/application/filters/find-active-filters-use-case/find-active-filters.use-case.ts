import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ActiveFiltersLookupPort } from "../../ports/active-filters-lookup.port";
import { ActiveFiltersResponse } from "../../../domain/read-models/active-filters-response";
import { FindActiveFiltersDto } from "./find-active-filters.dto";
import { mapActiveFiltersApplied } from "./map-active-filters-applied";

@Injectable()
export class FindActiveFiltersUseCase {
  constructor(
    private readonly active_filters_lookup_port: ActiveFiltersLookupPort,
  ) {}

  async execute(
    find_active_filters_dto: FindActiveFiltersDto,
  ): Promise<ActiveFiltersResponse> {
    const resolved = await this.active_filters_lookup_port.resolveResolved(
      find_active_filters_dto,
    );

    return {
      resolved,
      applied: mapActiveFiltersApplied(find_active_filters_dto),
    };
  }
}
