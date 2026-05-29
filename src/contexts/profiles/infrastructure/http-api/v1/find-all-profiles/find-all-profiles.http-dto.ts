import { PaginationHttpDto } from "@/src/contexts/shared/infrastructure/http-dtos/pagination.http-dto";
import { IsOptional, IsString, IsUUID } from "class-validator";


export class FindAllProfilesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID("4")
  role_id?: string;

  @IsOptional()
  @IsString()
  email?: string;
}