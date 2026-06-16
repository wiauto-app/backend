import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindAllDealershipDto extends PaginationDto {
  name?: string;
  slug?: string;
  email?: string;
  is_featured?: boolean;
}
