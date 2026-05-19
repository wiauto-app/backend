import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Type } from "class-transformer";

export class PaginationHttpDto {

  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(1) @Max(100)
  limit = 10;
  
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  order_by: string;

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  order_direction: "ASC" | "DESC" = "ASC";

  get skip(): number {
    return (this.page - 1) * this.limit;
  }

}