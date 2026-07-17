import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

import type { StatusVehicle } from "../types/vehicle";

export interface FindOwnerVehiclesDto extends PaginationDto {
  profile_id: string;
  status?: StatusVehicle;
}
