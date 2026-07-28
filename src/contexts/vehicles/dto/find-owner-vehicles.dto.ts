import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

import type { StatusVehicle } from "../types/vehicle";

export interface FindOwnerVehiclesDto extends PaginationDto {
  profile_id: string;
  status?: StatusVehicle;
  make_id?: number;
  model_id?: number;
  since_created_at?: Date;
  until_created_at?: Date;
}
