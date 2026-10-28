import { Type } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { CreateVehicleDto } from "@/src/contexts/vehicles/api/v1/create-vehicle/create-vehicle.http-dto";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  phone_code: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsString()
  referral_code?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateVehicleDto)
  pending_vehicle?: CreateVehicleDto;
}
