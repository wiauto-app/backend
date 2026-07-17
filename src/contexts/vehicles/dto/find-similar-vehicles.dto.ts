import { PaginationDto } from "@/src/contexts/shared/dto/pagination.dto";

export class FindSimilarVehiclesDto extends PaginationDto {
  vehicle_id: string;
}
