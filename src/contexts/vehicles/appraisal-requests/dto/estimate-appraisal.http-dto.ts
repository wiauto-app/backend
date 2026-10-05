import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

import { TRANSMISSION_TYPE, TransmissionType } from "../../types/vehicle";

export class EstimateAppraisalHttpDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  version_id!: number;

  @IsEnum(TRANSMISSION_TYPE)
  transmission_type!: TransmissionType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(2_000_000)
  mileage!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2000)
  power?: number;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Matches(/^[A-Za-z0-9 -]*$/, { message: "La matrícula no es válida" })
  plate?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  last_name?: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone_code!: string;

  @IsString()
  @MinLength(1)
  @Matches(/^\d+$/, { message: "El teléfono solo puede contener dígitos" })
  phone!: string;
}
