import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsNumber, IsOptional } from "class-validator";

export class FindAllVersionsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsNumber()
  model_id?: number;

  @IsOptional()
  @IsNumber()
  fuel_type_id?: number;

  @IsOptional()
  @IsNumber()
  year_id?: number;
}
