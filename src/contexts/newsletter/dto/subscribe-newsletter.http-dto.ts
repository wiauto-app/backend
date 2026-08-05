import { IsEmail, IsNotEmpty } from "class-validator";

export class SubscribeNewsletterHttpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
