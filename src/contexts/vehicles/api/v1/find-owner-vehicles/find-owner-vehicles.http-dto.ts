import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  STATUS_VEHICLE,
  StatusVehicle,
} from "@/src/contexts/vehicles/types/vehicle";
import { Type } from "class-transformer";
import { IsDate, IsIn, IsInt, IsOptional } from "class-validator";

export const OWNER_VEHICLES_ORDER_BY_OPTIONS = [
  "created_at",
  "price",
  "views",
  "leads",
] as const;

export class FindOwnerVehiclesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsIn(Object.values(STATUS_VEHICLE))
  status?: StatusVehicle;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  make_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  model_id?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  since_created_at?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  until_created_at?: Date;

  @IsOptional()
  @IsIn(OWNER_VEHICLES_ORDER_BY_OPTIONS)
  override order_by = "created_at";
}
