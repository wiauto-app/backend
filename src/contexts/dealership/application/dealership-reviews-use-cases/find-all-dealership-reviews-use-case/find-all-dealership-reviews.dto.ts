import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindAllDealershipReviewsDto extends PaginationDto {
  dealership_id: string;
  profile_id?: string;
  created_since?: Date;
  created_until?: Date;
}
