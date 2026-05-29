import { IsEmail, IsNotEmpty } from "class-validator";

export class MeUpdateEmailHttpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
