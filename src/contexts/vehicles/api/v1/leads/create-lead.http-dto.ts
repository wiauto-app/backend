import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateLeadHttpDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phone_code?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  message: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar los términos y condiciones" })
  accepted_terms: boolean;
}
