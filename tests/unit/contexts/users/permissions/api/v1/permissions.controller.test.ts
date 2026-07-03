import { ConflictException, NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { PermissionsController } from "@/contexts/users/permissions/api/v1/permissions.controller";
import { PermissionService } from "@/contexts/users/permissions/services/permission.service";

describe("PermissionsController", () => {
  let controller: PermissionsController;
  let permissionService: Mock<PermissionService>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    permissionService = createMock<PermissionService>();
    controller = new PermissionsController(permissionService);
  });

  describe("create", () => {
    it("should call permission_service.create with dto", () => {
      const dto = { name: "Crear usuario", key: "users.create", value: 1 } as any;
      const expected = { id, name: "Crear usuario", key: "users.create" } as any;
      permissionService.create.mockReturnValue(expected);

      const result = controller.create(dto);

      expect(permissionService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when permission_service.create throws", () => {
      const dto = { name: "Crear usuario", key: "users.create" } as any;
      permissionService.create.mockImplementation(() => { throw new ConflictException("La clave ya existe"); });

      expect(() => controller.create(dto)).toThrow(ConflictException);
    });
  });

  describe("sync_available_keys_file", () => {
    it("should call permission_service.sync_available_permission_keys_file", () => {
      const expected = { output_path: "/tmp/permissions.json", keys_written: 10 } as any;
      permissionService.sync_available_permission_keys_file.mockReturnValue(expected);

      const result = controller.sync_available_keys_file();

      expect(permissionService.sync_available_permission_keys_file).toHaveBeenCalled();
      expect(result).toBe(expected);
    });

    it("should throw when permission_service.sync_available_permission_keys_file throws", () => {
      permissionService.sync_available_permission_keys_file.mockImplementation(() => { throw new Error("Error de escritura"); });

      expect(() => controller.sync_available_keys_file()).toThrow(Error);
    });
  });

  describe("findAll", () => {
    it("should call permission_service.findAll with query dto", () => {
      const query = { page: 1, limit: 20 } as any;
      const expected = { data: [], total: 0 } as any;
      permissionService.findAll.mockReturnValue(expected);

      const result = controller.findAll(query);

      expect(permissionService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty paginated result when no permissions exist", () => {
      const query = { page: 1, limit: 20 } as any;
      permissionService.findAll.mockReturnValue({ data: [], total: 0, page: 1, limit: 20 } as any);

      const result = controller.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("findOne", () => {
    it("should call permission_service.findOne with id", () => {
      const findOneDto = { id } as any;
      const expected = { id, key: "users.create" } as any;
      permissionService.findOne.mockReturnValue(expected);

      const result = controller.findOne(findOneDto);

      expect(permissionService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(expected);
    });

    it("should throw when permission_service.findOne throws", () => {
      const findOneDto = { id } as any;
      permissionService.findOne.mockImplementation(() => { throw new NotFoundException("Permiso no encontrado"); });

      expect(() => controller.findOne(findOneDto)).toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should call permission_service.update with id and dto", () => {
      const updateDto = { name: "Updated Permission" } as any;
      const expected = { id, name: "Updated Permission" } as any;
      permissionService.update.mockReturnValue(expected);

      const result = controller.update(id, updateDto);

      expect(permissionService.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBe(expected);
    });

    it("should throw when permission_service.update throws", () => {
      const updateDto = { name: "Updated" } as any;
      permissionService.update.mockImplementation(() => { throw new NotFoundException("Permiso no encontrado"); });

      expect(() => controller.update(id, updateDto)).toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should call permission_service.remove with id", async () => {
      const deleteDto = { id } as any;
      permissionService.remove.mockResolvedValue(undefined);

      await controller.remove(deleteDto);

      expect(permissionService.remove).toHaveBeenCalledWith(id);
    });

    it("should throw when permission_service.remove throws", async () => {
      const deleteDto = { id } as any;
      permissionService.remove.mockRejectedValue(new NotFoundException("Permiso no encontrado"));

      await expect(controller.remove(deleteDto)).rejects.toThrow(NotFoundException);
    });
  });
});
