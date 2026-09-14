import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AppleMobileDto {
  @IsString()
  @IsNotEmpty()
  identity_token: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  authorization_code?: string;
}
