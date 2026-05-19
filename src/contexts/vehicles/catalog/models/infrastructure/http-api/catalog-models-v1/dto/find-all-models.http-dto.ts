import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsInt, IsOptional, IsPositive } from "class-validator";


export class FindAllModelsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  make_id: number;
}