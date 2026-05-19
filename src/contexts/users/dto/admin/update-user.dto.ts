import { PartialType } from "@nestjs/mapped-types";
import { RegisterUserDto } from "../register-user.dto";
import { IsOptional, IsString, IsUUID } from "class-validator";


export class AdminUpdateUserDto extends PartialType(RegisterUserDto) {
  @IsUUID("4")
  id: string;

  @IsUUID("4")
  @IsOptional()
  suspension_duration_type_id?: string;

  @IsString()
  @IsOptional()
  suspension_reason?: string;
}