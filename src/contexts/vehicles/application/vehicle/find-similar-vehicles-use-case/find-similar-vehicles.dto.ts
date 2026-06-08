import { PaginationDto } from "@/src/contexts/shared/application/dtos/pagination.dto";

export class FindSimilarVehiclesDto extends PaginationDto {
  vehicle_id: string;
}
