import { PaginationFilter } from "@/src/contexts/shared/domain/filters/pagination.filter";
import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

import type { StatusVehicle } from "../entities/vehicle";

export interface OwnerVehicleFilterOptions extends PaginationDto {
  profile_id: string;
  status?: StatusVehicle;
}

export class OwnerVehicleFilter
  extends PaginationFilter
  implements Omit<OwnerVehicleFilterOptions, "page" | "limit" | "query" | "order_by" | "order_direction">
{
  profile_id: string;
  status?: StatusVehicle;

  constructor(options: OwnerVehicleFilterOptions) {
    const { page, limit, order_direction, query, order_by, profile_id, status } =
      options;
    super(page, limit, order_direction, query, order_by);
    this.profile_id = profile_id;
    this.status = status;
  }
}
