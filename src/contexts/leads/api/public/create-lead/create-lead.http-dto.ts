import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

import { HoneypotHttpDto } from "@/src/common/antispam/honeypot";

/**
 * `extra_data` es un objeto libre (incluye el mensaje de /contacto); no se acota
 * aquí su contenido.
 */
export class CreateGenericLeadHttpDto extends HoneypotHttpDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  type!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  first_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  dni?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsOptional()
  @IsObject()
  extra_data?: Record<string, unknown>;
}
