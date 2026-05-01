import { IsEmail, IsNotEmpty } from "class-validator";

export class EmailVerificationResendDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
