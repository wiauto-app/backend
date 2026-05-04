import { IsArray, IsUUID } from "class-validator";

/** Sustituye el conjunto de permisos del rol. `[]` deja el rol sin permisos. */
export class AssignPermissionsToRoleDto {
  @IsArray()
  @IsUUID("4", { each: true })
  permission_ids: string[];
}
