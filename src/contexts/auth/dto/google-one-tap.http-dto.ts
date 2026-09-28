import { IsNotEmpty, IsString } from "class-validator";

export class GoogleOneTapHttpDto {
  @IsString()
  @IsNotEmpty()
  id_token: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;
}
