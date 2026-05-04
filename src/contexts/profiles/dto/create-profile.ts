import { IsOptional, IsString, IsUUID } from "class-validator";

export class CreateProfileDto {
  @IsUUID("4")
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsUUID("4")
  role_id?: string;
}
