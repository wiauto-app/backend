import { IsNotEmpty, IsUUID } from "class-validator";


export class FindOneRoleDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}