import { IsEmail, IsNotEmpty, MaxLength } from "class-validator";

import { HoneypotHttpDto } from "@/src/common/antispam/honeypot";

export class SubscribeNewsletterHttpDto extends HoneypotHttpDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  email: string;
}
