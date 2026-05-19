import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindAllYearsDto extends PaginationDto {
  model_id?: number;
  body_type_id?: number;
}
