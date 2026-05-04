import { IsNotEmpty, IsUUID } from "class-validator";

export class DeletePermissionDto {
  @IsNotEmpty()
  @IsUUID("4")
  id: string;
}
