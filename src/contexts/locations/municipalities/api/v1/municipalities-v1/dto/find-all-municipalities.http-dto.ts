import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";
import { IsOptional, IsString } from "class-validator";

export class FindAllMunicipalitiesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  province_slug?: string;
}
