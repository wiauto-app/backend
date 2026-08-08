import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class AdminUpdateUserDto {
  @IsUUID("4")
  id: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @IsUUID("4")
  @IsOptional()
  suspension_duration_type_id?: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsString()
  @IsOptional()
  suspension_reason?: string;
}
