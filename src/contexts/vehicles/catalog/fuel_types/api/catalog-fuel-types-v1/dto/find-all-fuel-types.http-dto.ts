import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { IsNumber, IsOptional } from "class-validator";



export class FindAllFuelTypesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsNumber()
  model_id?: number;
}