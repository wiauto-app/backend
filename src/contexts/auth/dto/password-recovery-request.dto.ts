import { IsEmail, IsNotEmpty, IsUrl } from "class-validator";

export class PasswordRecoveryRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  redirect_url: string;
}
