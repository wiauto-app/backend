import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationHttpDto {
  
  @IsOptional()
  @IsString()
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1) @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  order_by: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  order_direction: "asc" | "desc";
}