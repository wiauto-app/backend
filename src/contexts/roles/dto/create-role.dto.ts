import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsBoolean()
  @IsNotEmpty()
  is_admin: boolean;

  @IsBoolean()
  @IsNotEmpty()
  is_developer: boolean;

  @IsOptional()
  @IsBoolean()
  is_default?: boolean;


}