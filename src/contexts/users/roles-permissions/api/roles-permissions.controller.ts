import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from "@nestjs/common";

import { RolesPermissionsService } from "../services/roles-permissions.service";

import { RolePermissionDto } from "../dto/role-permission.dto";
import { V1_ROLES_PERMISSIONS } from "../../route.constants";
import { SyncRolesPermissionDto } from "../dto/sync-roles-permission.dto";

@Controller(V1_ROLES_PERMISSIONS)
export class RolesPermissionsController {
  constructor(
    private readonly rolesPermissionsService: RolesPermissionsService,
  ) { }

  @Post()
  async assignPermission(
    @Body()
    rolePermissionDto: RolePermissionDto,
  ) {
    await this.rolesPermissionsService.assignPermission(
      rolePermissionDto.role_id,
      rolePermissionDto.permission_id,
    );

    return {
      success: true,
      message: "Permiso asignado correctamente",
    };
  }

  @Delete()
  async removePermission(
    @Body()
    rolePermissionDto: RolePermissionDto,
  ) {
    await this.rolesPermissionsService.removePermission(
      rolePermissionDto.role_id,
      rolePermissionDto.permission_id,
    );

    return {
      success: true,
      message: "Permiso eliminado correctamente",
    };
  }

  @Put()
  async syncPermissions(
    @Body()
    syncRolesPermissionDto: SyncRolesPermissionDto,
  ) {
    await this.rolesPermissionsService.syncPermissions(
      syncRolesPermissionDto.role_id,
      syncRolesPermissionDto.permission_ids,
    );

    return {
      success: true,
      message: "Permisos asignados al rol correctamente",
    };
  }

  /*
   |--------------------------------------------------------------------------
   | Get Role Permissions
   |--------------------------------------------------------------------------
   */

  @Get(":roleId")
  async getRolePermissions(
    @Param("roleId", ParseUUIDPipe)
    roleId: string,
  ) {
    const permissions =
      await this.rolesPermissionsService.getRolePermissions(
        roleId,
      );

    return {
      success: true,
      data: permissions,
    };
  }
}