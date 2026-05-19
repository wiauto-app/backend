import { PaginationHttpDto } from "../../shared/infrastructure/http-dtos/pagination.http-dto";
import { IsOptional, IsString, IsBoolean } from "class-validator";


export class FindAllRolesDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @IsOptional()
  @IsBoolean()
  is_developer?: boolean;
}