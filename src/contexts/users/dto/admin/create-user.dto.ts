import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";


export class AdminCreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsUUID("4")
  @IsNotEmpty()
  role_id: string;

  @IsOptional()
  @IsString()
  avatar_url?: string;
}