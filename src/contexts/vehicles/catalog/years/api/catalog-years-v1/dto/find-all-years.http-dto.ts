import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { IsNumber, IsOptional } from "class-validator";

export class FindAllYearsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsNumber()
  model_id?: number;

  @IsOptional()
  @IsNumber()
  body_type_id?: number;
}
