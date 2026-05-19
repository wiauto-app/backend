import { IsArray, IsNotEmpty, IsUUID } from "class-validator";


export class SyncRolesPermissionDto {
  @IsNotEmpty()
  @IsUUID("4")
  role_id: string;

  @IsArray()
  @IsUUID("4", { each: true })
  permission_ids: string[];
}