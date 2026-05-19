import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsNumber, IsOptional } from "class-validator";



export class FindAllFuelTypesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsNumber()
  model_id?: number;
}