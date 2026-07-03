import { BadRequestException, NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { RolesPermissionsController } from "@/contexts/users/roles-permissions/api/roles-permissions.controller";
import { RolesPermissionsService } from "@/contexts/users/roles-permissions/services/roles-permissions.service";

describe("RolesPermissionsController", () => {
  let controller: RolesPermissionsController;
  let rolesPermissionsService: Mock<RolesPermissionsService>;

  const roleId = "550e8400-e29b-41d4-a716-446655440001";
  const permissionId = "550e8400-e29b-41d4-a716-446655440002";

  beforeEach(() => {
    rolesPermissionsService = createMock<RolesPermissionsService>();
    controller = new RolesPermissionsController(rolesPermissionsService);
  });

  describe("assignPermission", () => {
    it("should assign permission and return success message", async () => {
      const dto = { role_id: roleId, permission_id: permissionId };
      rolesPermissionsService.assignPermission.mockResolvedValue(undefined);

      const result = await controller.assignPermission(dto);

      expect(rolesPermissionsService.assignPermission).toHaveBeenCalledWith(roleId, permissionId);
      expect(result).toEqual({
        success: true,
        message: "Permiso asignado correctamente",
      });
    });

    it("should throw when rolesPermissionsService.assignPermission throws", async () => {
      const dto = { role_id: roleId, permission_id: permissionId };
      rolesPermissionsService.assignPermission.mockRejectedValue(new NotFoundException("Rol no encontrado"));

      await expect(controller.assignPermission(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("removePermission", () => {
    it("should remove permission and return success message", async () => {
      const dto = { role_id: roleId, permission_id: permissionId };
      rolesPermissionsService.removePermission.mockResolvedValue(undefined);

      const result = await controller.removePermission(dto);

      expect(rolesPermissionsService.removePermission).toHaveBeenCalledWith(roleId, permissionId);
      expect(result).toEqual({
        success: true,
        message: "Permiso eliminado correctamente",
      });
    });

    it("should throw when rolesPermissionsService.removePermission throws", async () => {
      const dto = { role_id: roleId, permission_id: permissionId };
      rolesPermissionsService.removePermission.mockRejectedValue(new NotFoundException("Permiso no asignado"));

      await expect(controller.removePermission(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("syncPermissions", () => {
    it("should sync permissions and return success message", async () => {
      const permissionIds = [permissionId];
      const dto = { role_id: roleId, permission_ids: permissionIds };
      rolesPermissionsService.syncPermissions.mockResolvedValue(undefined);

      const result = await controller.syncPermissions(dto);

      expect(rolesPermissionsService.syncPermissions).toHaveBeenCalledWith(roleId, permissionIds);
      expect(result).toEqual({
        success: true,
        message: "Permisos asignados al rol correctamente",
      });
    });

    it("should work with empty permission_ids array", async () => {
      const dto = { role_id: roleId, permission_ids: [] };
      rolesPermissionsService.syncPermissions.mockResolvedValue(undefined);

      const result = await controller.syncPermissions(dto);

      expect(rolesPermissionsService.syncPermissions).toHaveBeenCalledWith(roleId, []);
      expect(result).toEqual({
        success: true,
        message: "Permisos asignados al rol correctamente",
      });
    });

    it("should throw when rolesPermissionsService.syncPermissions throws", async () => {
      const dto = { role_id: roleId, permission_ids: [permissionId] };
      rolesPermissionsService.syncPermissions.mockRejectedValue(new BadRequestException("Error al sincronizar"));

      await expect(controller.syncPermissions(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("getRolePermissions", () => {
    it("should return role permissions", async () => {
      const permissions = [{ role_id: roleId, permission_id: permissionId }] as any;
      rolesPermissionsService.getRolePermissions.mockResolvedValue(permissions);

      const result = await controller.getRolePermissions(roleId);

      expect(rolesPermissionsService.getRolePermissions).toHaveBeenCalledWith(roleId);
      expect(result).toEqual({
        success: true,
        data: permissions,
      });
    });

    it("should return empty array when role has no permissions", async () => {
      rolesPermissionsService.getRolePermissions.mockResolvedValue([]);

      const result = await controller.getRolePermissions(roleId);

      expect(result).toEqual({
        success: true,
        data: [],
      });
    });
  });
});
