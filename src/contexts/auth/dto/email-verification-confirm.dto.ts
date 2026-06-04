import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class EmailVerificationConfirmDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
