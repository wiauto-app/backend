import { IsEmail, IsOptional, IsString } from "class-validator";

export class CreateAlertFromVehicleHttpDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  phone_code?: string;
}
