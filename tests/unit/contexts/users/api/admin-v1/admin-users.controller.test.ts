import { ConflictException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminUsersController } from "@/contexts/users/api/admin-v1/admin-users.controller";
import { AdminUserService } from "@/contexts/users/services/admin-user.service";

describe("AdminUsersController", () => {
  let controller: AdminUsersController;
  let adminUserService: Mock<AdminUserService>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    adminUserService = createMock<AdminUserService>();
    controller = new AdminUsersController(adminUserService);
  });

  describe("create", () => {
    it("should call adminUserService.create with dto", () => {
      const dto = { email: "admin@test.com", password: "pass123" } as any;
      const expected = { id, email: "admin@test.com" } as any;
      adminUserService.create.mockReturnValue(expected);

      const result = controller.create(dto);

      expect(adminUserService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when adminUserService.create throws", () => {
      const dto = { email: "existing@test.com" } as any;
      adminUserService.create.mockImplementation(() => { throw new ConflictException("Email ya existe"); });

      expect(() => controller.create(dto)).toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("should call adminUserService.update with dto", () => {
      const dto = { id, name: "Updated" } as any;
      const expected = { id, name: "Updated" } as any;
      adminUserService.update.mockReturnValue(expected);

      const result = controller.update(dto);

      expect(adminUserService.update).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when adminUserService.update throws", () => {
      const dto = { id, name: "Updated" } as any;
      adminUserService.update.mockImplementation(() => { throw new ConflictException("Conflicto"); });

      expect(() => controller.update(dto)).toThrow(ConflictException);
    });
  });

  describe("delete", () => {
    it("should call adminUserService.delete with id", () => {
      adminUserService.delete.mockReturnValue(undefined as any);

      const result = controller.delete(id);

      expect(adminUserService.delete).toHaveBeenCalledWith(id);
      expect(result).toBeUndefined();
    });

    it("should throw when adminUserService.delete throws", () => {
      adminUserService.delete.mockImplementation(() => { throw new ConflictException("Conflicto"); });

      expect(() => controller.delete(id)).toThrow(ConflictException);
    });
  });
});
