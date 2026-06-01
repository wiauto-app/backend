import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";


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

  @IsUUID("4")
  @IsOptional()
  role_id?: string;

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