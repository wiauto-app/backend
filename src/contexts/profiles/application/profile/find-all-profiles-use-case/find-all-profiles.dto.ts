import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";
export class FindAllProfilesDto extends PaginationDto {
  name?: string;
  role_id?: string; 
  email?: string;
}