import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, } from "class-validator";

export class RegisterUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsUUID("4")
  role_id: string;
}
