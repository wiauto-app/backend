import { ConflictException, NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { RolesController } from "@/contexts/roles/api/v1/roles.controller";
import { RolesService } from "@/contexts/roles/services/roles.service";

describe("RolesController", () => {
  let controller: RolesController;
  let rolesService: Mock<RolesService>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    rolesService = createMock<RolesService>();
    controller = new RolesController(rolesService);
  });

  describe("create", () => {
    it("should call rolesService.create with dto", () => {
      const dto = { name: "Admin", is_admin: true } as any;
      const expected = { id, name: "Admin" } as any;
      rolesService.create.mockReturnValue(expected);

      const result = controller.create(dto);

      expect(rolesService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when rolesService.create throws", () => {
      const dto = { name: "Admin" } as any;
      rolesService.create.mockImplementation(() => { throw new ConflictException("El rol ya existe"); });

      expect(() => controller.create(dto)).toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should call rolesService.findAll with query dto", () => {
      const query = { page: 1, limit: 20 } as any;
      const expected = { data: [], total: 0 } as any;
      rolesService.findAll.mockReturnValue(expected);

      const result = controller.findAll(query);

      expect(rolesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty paginated result when no roles exist", () => {
      const query = { page: 1, limit: 20 } as any;
      rolesService.findAll.mockReturnValue({ data: [], total: 0, page: 1, limit: 20 } as any);

      const result = controller.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("assign_permissions", () => {
    it("should call rolesService.assign_permissions with role_id and permission_ids", () => {
      const permissionIds = [
        "550e8400-e29b-41d4-a716-446655440001",
        "550e8400-e29b-41d4-a716-446655440002",
      ];
      const dto = { permission_ids: permissionIds } as any;
      const expected = { id, permissions: [] } as any;
      rolesService.assign_permissions.mockReturnValue(expected);

      const result = controller.assign_permissions(id, dto);

      expect(rolesService.assign_permissions).toHaveBeenCalledWith(id, permissionIds);
      expect(result).toBe(expected);
    });

    it("should work with empty permission_ids array", () => {
      const dto = { permission_ids: [] } as any;
      const expected = { id, permissions: [] } as any;
      rolesService.assign_permissions.mockReturnValue(expected);

      const result = controller.assign_permissions(id, dto);

      expect(rolesService.assign_permissions).toHaveBeenCalledWith(id, []);
      expect(result).toBe(expected);
    });

    it("should throw when rolesService.assign_permissions throws", () => {
      const dto = { permission_ids: ["550e8400-e29b-41d4-a716-446655440001"] } as any;
      rolesService.assign_permissions.mockImplementation(() => { throw new NotFoundException("Rol no encontrado"); });

      expect(() => controller.assign_permissions(id, dto)).toThrow(NotFoundException);
    });
  });

  describe("findOne", () => {
    it("should call rolesService.findOne with id", () => {
      const findOneDto = { id } as any;
      const expected = { id, name: "Admin" } as any;
      rolesService.findOne.mockReturnValue(expected);

      const result = controller.findOne(findOneDto);

      expect(rolesService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(expected);
    });

    it("should throw when rolesService.findOne throws", () => {
      const findOneDto = { id } as any;
      rolesService.findOne.mockImplementation(() => { throw new NotFoundException("Rol no encontrado"); });

      expect(() => controller.findOne(findOneDto)).toThrow(NotFoundException);
    });
  });

  describe("update", () => {
    it("should call rolesService.update with id and dto", () => {
      const updateDto = { name: "Super Admin" } as any;
      const expected = { id, name: "Super Admin" } as any;
      rolesService.update.mockReturnValue(expected);

      const result = controller.update(id, updateDto);

      expect(rolesService.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toBe(expected);
    });

    it("should throw when rolesService.update throws", () => {
      const updateDto = { name: "Super Admin" } as any;
      rolesService.update.mockImplementation(() => { throw new ConflictException("El nombre ya existe"); });

      expect(() => controller.update(id, updateDto)).toThrow(ConflictException);
    });
  });

  describe("remove", () => {
    it("should call rolesService.remove with id", () => {
      const deleteDto = { id } as any;
      const expected = { id, deleted_at: new Date() } as any;
      rolesService.remove.mockReturnValue(expected);

      const result = controller.remove(deleteDto);

      expect(rolesService.remove).toHaveBeenCalledWith(id);
      expect(result).toBe(expected);
    });

    it("should throw when rolesService.remove throws", () => {
      const deleteDto = { id } as any;
      rolesService.remove.mockImplementation(() => { throw new NotFoundException("Rol no encontrado"); });

      expect(() => controller.remove(deleteDto)).toThrow(NotFoundException);
    });
  });
});
