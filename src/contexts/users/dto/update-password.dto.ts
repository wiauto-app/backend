import { PickType } from "@nestjs/mapped-types";
import { CreateUserDto } from "./create-user.dto";
import { IsNotEmpty, IsString } from "class-validator";


export class UpdatePasswordDto extends PickType(CreateUserDto,["password"]){
  @IsString()
  @IsNotEmpty()
  current_password:string
}