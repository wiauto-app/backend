import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  STATUS_VEHICLE,
  StatusVehicle,
} from "@/src/contexts/vehicles/types/vehicle";
import { IsIn, IsOptional } from "class-validator";

export class FindOwnerVehiclesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsIn(Object.values(STATUS_VEHICLE))
  status?: StatusVehicle;
}
