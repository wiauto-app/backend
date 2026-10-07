import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { IsOptional, IsString } from "class-validator";

export class FindAllProvincesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  cod_ccaa?: string;
}
