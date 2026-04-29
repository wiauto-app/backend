import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationHttpDto {
  
  @IsOptional()
  @IsString()
  query: string;

  @IsNumber()
  @Type(() => Number)
  @IsNotEmpty()
  @Min(1)
  page = 1;

  @IsNumber() 
  @Type(() => Number)
  @IsNotEmpty()
  @Min(1)
  limit = 20;

  @IsOptional()
  @IsString()
  order_by: string;

  @IsOptional()
  @IsEnum(["asc", "desc"])
  order_direction: "asc" | "desc";
}