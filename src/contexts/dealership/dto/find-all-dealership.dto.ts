import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

export class FindAllDealershipDto extends PaginationDto {
  name?: string;
  slug?: string;
  email?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  province_slug?: string;
  rating_since?: number;
  vehicles_number?: number;
  is_featured?: boolean;
}
