import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

import {
  VEHICLE_SEARCH_HISTORY_DEFAULT_LIMIT,
  VEHICLE_SEARCH_HISTORY_MAX_PER_USER,
} from "../../../services/vehicle-search-history.service";

export class FindVehicleSearchHistoryHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(VEHICLE_SEARCH_HISTORY_MAX_PER_USER)
  limit: number = VEHICLE_SEARCH_HISTORY_DEFAULT_LIMIT;
}
