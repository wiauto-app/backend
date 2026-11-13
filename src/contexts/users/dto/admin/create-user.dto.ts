import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

import { AdminCreateUserDealershipDto } from "./create-user-dealership.dto";

export class AdminCreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsOptional()
  @IsBoolean()
  is_admin?: boolean;

  @IsOptional()
  @IsString()
  avatar_url?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdminCreateUserDealershipDto)
  dealership?: AdminCreateUserDealershipDto;
}
