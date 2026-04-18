import { PartialType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";

export class UpdateUserDto extends PartialType(CreateUserDto) {
  last_sign_in?:Date

  two_factor_enabled?:boolean;

  two_factor_secret?:string | null;

  two_factor_backup_codes?:string[] | null
}