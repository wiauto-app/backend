import { IsUUID } from "class-validator";

export class RolePermissionDto {
  @IsUUID("4")
  role_id: string;

  @IsUUID("4")
  permission_id: string;
}