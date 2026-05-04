import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";


export class FindAllReviewsDto extends PaginationDto {
  vehicle_id: string;
  profile_id?: string;
  created_since?: Date;
  created_until?: Date;
}