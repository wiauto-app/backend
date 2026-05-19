import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";


export class FindAllBodyTypesDto extends PaginationDto {
  model_id?: number;
}