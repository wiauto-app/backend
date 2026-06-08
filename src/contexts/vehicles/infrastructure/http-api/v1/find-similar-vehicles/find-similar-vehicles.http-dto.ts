import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsNotEmpty, IsUUID } from "class-validator";

export class FindSimilarVehiclesParamsHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}

export class FindSimilarVehiclesQueryHttpDto extends PaginationHttpDto {}
