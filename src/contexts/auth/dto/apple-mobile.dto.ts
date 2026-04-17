import { IsNotEmpty, IsString } from "class-validator";

export class AppleMobileDto {
  @IsString()
  @IsNotEmpty()
  identity_token: string;
}
