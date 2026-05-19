import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindAllFuelTypesDto extends PaginationDto {
  model_id?: number;
}