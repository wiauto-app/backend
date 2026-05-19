import { DataSource, In } from "typeorm";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { RolesPermissionsEntity } from "../entities/roles-permissions.entity";

@Injectable()
export class RolesPermissionsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /*
   |--------------------------------------------------------------------------
   | Assign Permission
   |--------------------------------------------------------------------------
   */

  async assignPermission(
    roleId: string,
    permissionId: string,
  ) {
    const repository = this.dataSource.getRepository(
      RolesPermissionsEntity,
    );

    const exists = await repository.exists({
      where: {
        role_id: roleId,
        permission_id: permissionId,
      },
    });

    if (exists) {
      return;
    }

    await repository.insert({
      role_id: roleId,
      permission_id: permissionId,
    });
  }

  /*
   |--------------------------------------------------------------------------
   | Remove Permission
   |--------------------------------------------------------------------------
   */

  async removePermission(
    roleId: string,
    permissionId: string,
  ) {
    const repository = this.dataSource.getRepository(
      RolesPermissionsEntity,
    );

    await repository.delete({
      role_id: roleId,
      permission_id: permissionId,
    });
  }

  /*
   |--------------------------------------------------------------------------
   | Sync Permissions
   |--------------------------------------------------------------------------
   */

  async syncPermissions(
    roleId: string,
    permissionIds: string[],
  ) {
    await this.dataSource.transaction(async manager => {
      const repository = manager.getRepository(
        RolesPermissionsEntity,
      );

      /*
       |--------------------------------------------------------------------------
       | Current Permissions
       |--------------------------------------------------------------------------
       */

      const currentPermissions = await repository.find({
        where: {
          role_id: roleId,
        },
        select: {
          permission_id: true,
        },
      });

      const currentPermissionIds =
        currentPermissions.map(
          permission => permission.permission_id,
        );

      /*
       |--------------------------------------------------------------------------
       | Calculate Changes
       |--------------------------------------------------------------------------
       */

      const toAdd = permissionIds.filter(
        permissionId =>
          !currentPermissionIds.includes(permissionId),
      );

      const toRemove = currentPermissionIds.filter(
        permissionId =>
          !permissionIds.includes(permissionId),
      );

      /*
       |--------------------------------------------------------------------------
       | Insert New Permissions
       |--------------------------------------------------------------------------
       */

      if (toAdd.length > 0) {
        await repository.insert(
          toAdd.map(permission_id => ({
            role_id: roleId,
            permission_id,
          })),
        );
      }

      /*
       |--------------------------------------------------------------------------
       | Remove Old Permissions
       |--------------------------------------------------------------------------
       */

      if (toRemove.length > 0) {
        await repository.delete({
          role_id: roleId,
          permission_id: In(toRemove),
        });
      }
    });
  }

  /*
   |--------------------------------------------------------------------------
   | Get Role Permissions
   |--------------------------------------------------------------------------
   */

  async getRolePermissions(roleId: string) {
    const repository = this.dataSource.getRepository(
      RolesPermissionsEntity,
    );

    return repository.find({
      where: {
        role_id: roleId,
      },
      relations: {
        permission: true,
      },
      order: {
        permission: {
          name: "ASC",
        },
      },
    });
  }
}