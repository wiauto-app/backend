import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class FindSearchMakesHttpDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  province_id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  since_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  until_price?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  order_by?: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order_direction: "ASC" | "DESC" = "ASC";
}
