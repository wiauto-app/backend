import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";


export class FindAllModelDto extends PaginationDto {
  make_id: number;
}