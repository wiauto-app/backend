import { IsEmail, IsNotEmpty } from "class-validator";

export class PasswordRecoveryRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
