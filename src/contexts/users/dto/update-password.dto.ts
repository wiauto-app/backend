import { PickType } from "@nestjs/mapped-types";
import { RegisterUserDto } from "./register-user.dto";
import { IsNotEmpty, IsString } from "class-validator";


export class UpdatePasswordDto extends PickType(RegisterUserDto,["password"]){
  @IsString()
  @IsNotEmpty()
  current_password:string
}