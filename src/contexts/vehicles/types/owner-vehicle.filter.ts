import { PaginationFilter } from "@/src/contexts/shared/types/pagination.filter";
import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

import type { StatusVehicle } from "./vehicle";

export interface OwnerVehicleFilterOptions extends PaginationDto {
  profile_id: string;
  status?: StatusVehicle;
  make_id?: number;
  model_id?: number;
  since_created_at?: Date;
  until_created_at?: Date;
}

export class OwnerVehicleFilter
  extends PaginationFilter
  implements Omit<OwnerVehicleFilterOptions, "page" | "limit" | "query" | "order_by" | "order_direction">
{
  profile_id: string;
  status?: StatusVehicle;
  make_id?: number;
  model_id?: number;
  since_created_at?: Date;
  until_created_at?: Date;

  constructor(options: OwnerVehicleFilterOptions) {
    const {
      page,
      limit,
      order_direction,
      query,
      order_by,
      profile_id,
      status,
      make_id,
      model_id,
      since_created_at,
      until_created_at,
    } = options;
    super(page ?? 1, limit ?? 10, order_direction, query, order_by);
    this.profile_id = profile_id;
    this.status = status;
    this.make_id = make_id;
    this.model_id = model_id;
    this.since_created_at = since_created_at;
    this.until_created_at = until_created_at;
  }
}
