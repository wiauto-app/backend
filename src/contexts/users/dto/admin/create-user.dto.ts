import { IsEmail, IsNotEmpty, IsString } from "class-validator";


export class AdminCreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}