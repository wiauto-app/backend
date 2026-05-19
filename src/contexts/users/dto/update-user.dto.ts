import { PartialType } from "@nestjs/mapped-types";
import { RegisterUserDto } from "./register-user.dto";
import { IsOptional } from "class-validator";

export class UpdateUserDto extends PartialType(RegisterUserDto) {

  @IsOptional() 
  password?: string;

  last_sign_in?:Date

  two_factor_enabled?:boolean;

  two_factor_secret?:string | null;

  two_factor_backup_codes?:string[] | null;

  is_email_verified?: boolean;
}