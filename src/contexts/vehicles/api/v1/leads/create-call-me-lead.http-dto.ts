import {
  Equals,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  MinLength,
} from "class-validator";

export class CreateCallMeLeadHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsDateString({ strict: true })
  callback_scheduled_at: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar los términos y condiciones" })
  accepted_terms: boolean;
}
