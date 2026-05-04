import { IsNotEmpty, IsUUID } from "class-validator";


export class DeleteRoleDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}