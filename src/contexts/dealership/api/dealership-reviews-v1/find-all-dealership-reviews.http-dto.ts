import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from "class-validator";

export class FindAllDealershipReviewsHttpDto extends PaginationHttpDto {
  @IsUUID("4")
  @IsNotEmpty()
  dealership_id: string;

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
