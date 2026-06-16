import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

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

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  is_featured?: boolean;
}
