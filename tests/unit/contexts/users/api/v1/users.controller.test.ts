import { ConflictException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { UsersController } from "@/contexts/users/api/v1/users.controller";
import { UserService } from "@/contexts/users/services/user.service";

describe("UsersController", () => {
  let controller: UsersController;
  let userService: Mock<UserService>;

  const id = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    userService = createMock<UserService>();
    controller = new UsersController(userService);
  });

  describe("create", () => {
    it("should call userService.create with dto", () => {
      const dto = { email: "test@test.com", password: "pass123", name: "Test" } as any;
      const expected = { data: { id } } as any;
      userService.create.mockReturnValue(expected);

      const result = controller.create(dto);

      expect(userService.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when userService.create throws", () => {
      const dto = { email: "existing@test.com" } as any;
      userService.create.mockImplementation(() => { throw new ConflictException("Email ya registrado"); });

      expect(() => controller.create(dto)).toThrow(ConflictException);
    });
  });

  describe("findAll", () => {
    it("should call userService.findAll", () => {
      const expected = [{ id, email: "test@test.com" }] as any;
      userService.findAll.mockReturnValue(expected);

      const result = controller.findAll();

      expect(userService.findAll).toHaveBeenCalled();
      expect(result).toBe(expected);
    });

    it("should return empty array when no users exist", () => {
      userService.findAll.mockReturnValue([]);

      const result = controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe("find_one", () => {
    it("should call userService.findOne with id", () => {
      const expected = { id, email: "test@test.com" } as any;
      userService.findOne.mockReturnValue(expected);

      const result = controller.find_one(id);

      expect(userService.findOne).toHaveBeenCalledWith(id);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call userService.update with id and dto", () => {
      const dto = { name: "Updated" } as any;
      const expected = { data: { id, name: "Updated" } } as any;
      userService.update.mockReturnValue(expected);

      const result = controller.update(id, dto);

      expect(userService.update).toHaveBeenCalledWith(id, dto);
      expect(result).toBe(expected);
    });

    it("should throw when userService.update throws", () => {
      const dto = { name: "Updated" } as any;
      userService.update.mockImplementation(() => { throw new ConflictException("Conflicto"); });

      expect(() => controller.update(id, dto)).toThrow(ConflictException);
    });
  });

  describe("remove", () => {
    it("should call userService.remove with id", async () => {
      userService.remove.mockResolvedValue(undefined);

      await controller.remove(id);

      expect(userService.remove).toHaveBeenCalledWith(id);
    });

    it("should throw when userService.remove throws", async () => {
      userService.remove.mockRejectedValue(new ConflictException("Conflicto"));

      await expect(controller.remove(id)).rejects.toThrow(ConflictException);
    });
  });
});
