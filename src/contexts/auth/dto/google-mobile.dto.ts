import { IsNotEmpty, IsString } from "class-validator";

export class GoogleMobileDto {
  @IsString()
  @IsNotEmpty()
  id_token: string;
}
