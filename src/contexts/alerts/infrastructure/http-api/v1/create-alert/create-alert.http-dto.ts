import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

import { AlertFiltersHttpDto } from "../alert-filters.http-dto";

export class CreateAlertHttpDto extends AlertFiltersHttpDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  phone_code: string;
}
