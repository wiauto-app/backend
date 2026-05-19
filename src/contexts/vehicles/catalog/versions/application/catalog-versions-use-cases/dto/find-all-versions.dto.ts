import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindAllVersionsDto extends PaginationDto {
  model_id?: number;
  fuel_type_id?: number;
  year_id?: number;
}
