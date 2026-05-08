import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsOptional, IsString } from "class-validator";

export class FindAllDealershipsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
