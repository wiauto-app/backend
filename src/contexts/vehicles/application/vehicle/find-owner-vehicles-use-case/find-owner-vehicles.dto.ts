import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

import type { StatusVehicle } from "../../../domain/entities/vehicle";

export interface FindOwnerVehiclesDto extends PaginationDto {
  profile_id: string;
  status?: StatusVehicle;
}
