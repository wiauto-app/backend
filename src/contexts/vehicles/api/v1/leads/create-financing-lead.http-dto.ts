import {
  Equals,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

import { HoneypotHttpDto } from "@/src/common/antispam/honeypot";

export class CreateFinancingLeadHttpDto extends HoneypotHttpDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsEmail()
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty({ message: "El teléfono es obligatorio" })
  @MaxLength(30)
  phone: string;

  @IsString()
  @IsNotEmpty({ message: "El prefijo telefónico es obligatorio" })
  @MaxLength(10)
  phone_code: string;

  @IsNumber({}, { message: "La entrada debe ser un número" })
  @Min(0)
  @Max(95)
  down_payment_percent: number;

  @IsInt({ message: "El plazo debe ser un número entero de meses" })
  @Min(1)
  @Max(240)
  term_months: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  @IsBoolean()
  @Equals(true, { message: "Debes aceptar los términos y condiciones" })
  accepted_terms: boolean;
}
