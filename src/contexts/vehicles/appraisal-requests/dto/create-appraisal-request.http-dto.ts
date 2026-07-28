import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

import { TRANSMISSION_TYPE, TransmissionType } from "../../types/vehicle";

export class CreateAppraisalRequestHttpDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  make_id!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  model_id!: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  year_id!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  version_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  fuel_type_id?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  body_type_id?: number;

  @IsEnum(TRANSMISSION_TYPE)
  transmission_type!: TransmissionType;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  mileage!: number;

  @Type(() => Number)
  @Min(-90)
  @Max(90)
  lat!: number;

  @Type(() => Number)
  @Min(-180)
  @Max(180)
  lng!: number;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  phone_code!: string;

  @IsString()
  @MinLength(1)
  phone!: string;
}
