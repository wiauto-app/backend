import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenMobileDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
