import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from "class-validator";

export class FindAllReviewsHttpDto extends PaginationHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  vehicle_id: string;

  @IsOptional()
  @IsUUID("4")
  profile_id?: string;

  @IsOptional()
  @IsDateString()
  created_since?: string;

  @IsOptional()
  @IsDateString()
  created_until?: string;
}
