import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { IsNotEmpty, IsUUID } from "class-validator";

export class FindSimilarVehiclesParamsHttpDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}

export class FindSimilarVehiclesQueryHttpDto extends PaginationHttpDto {}
