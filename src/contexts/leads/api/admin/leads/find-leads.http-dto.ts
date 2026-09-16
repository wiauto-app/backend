import { IsOptional, IsString } from "class-validator";

import { PaginationHttpDto } from "@/src/contexts/shared/dto/pagination.http-dto";

export class FindGenericLeadsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  type?: string;
}
