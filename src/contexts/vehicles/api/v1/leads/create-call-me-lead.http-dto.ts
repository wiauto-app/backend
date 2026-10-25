import {
  Equals,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import { HoneypotHttpDto } from "@/src/common/antispam/honeypot";

export class CreateCallMeLeadHttpDto extends HoneypotHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  phone_code: string;

  @IsDateString({ strict: true })
  callback_scheduled_at: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar los términos y condiciones" })
  accepted_terms: boolean;
}
