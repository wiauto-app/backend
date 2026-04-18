import { IsEmail, IsNotEmpty, IsString } from "class-validator";


export class ValidateBackupCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsEmail()
  @IsNotEmpty()
  email: string
}