import { ConflictException, NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminSuspensionController } from "@/contexts/users/api/admin-v1/admin-suspension.controller";
import { AdminSuspensionService } from "@/contexts/users/services/admin-suspension.service";

describe("AdminSuspensionController", () => {
  let controller: AdminSuspensionController;
  let adminSuspensionService: Mock<AdminSuspensionService>;

  const dto = { id: "550e8400-e29b-41d4-a716-446655440000" } as any;

  beforeEach(() => {
    adminSuspensionService = createMock<AdminSuspensionService>();
    controller = new AdminSuspensionController(adminSuspensionService);
  });

  describe("findAll", () => {
    it("should call adminSuspensionService.findAll with query dto", async () => {
      const query = { page: 1, limit: 10 } as any;
      const expected = { data: [], total: 0 } as any;
      adminSuspensionService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(adminSuspensionService.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty paginated result when no suspension types exist", async () => {
      const query = { page: 1, limit: 10 } as any;
      adminSuspensionService.findAll.mockResolvedValue({ data: [], total: 0, page: 1, limit: 10 } as any);

      const result = await controller.findAll(query);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("findOne", () => {
    it("should call adminSuspensionService.findOne with dto", async () => {
      const expected = { id: dto.id, key: "temporary" } as any;
      adminSuspensionService.findOne.mockResolvedValue(expected);

      const result = await controller.findOne(dto);

      expect(adminSuspensionService.findOne).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });

    it("should throw when adminSuspensionService.findOne throws", async () => {
      adminSuspensionService.findOne.mockRejectedValue(new NotFoundException("Tipo de suspensión no encontrado"));

      await expect(controller.findOne(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("should call adminSuspensionService.create with dto", async () => {
      const createDto = { key: "new-type", label: "New Type", duration_ms: null, is_active: true } as any;
      const expected = { id: "new-id", ...createDto } as any;
      adminSuspensionService.create.mockResolvedValue(expected);

      const result = await controller.create(createDto);

      expect(adminSuspensionService.create).toHaveBeenCalledWith(createDto);
      expect(result).toBe(expected);
    });

    it("should throw when adminSuspensionService.create throws", async () => {
      const createDto = { key: "existing", label: "Existing" } as any;
      adminSuspensionService.create.mockRejectedValue(new ConflictException("La clave ya existe"));

      await expect(controller.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe("update", () => {
    it("should call adminSuspensionService.update with dto", async () => {
      const updateDto = { id: dto.id, label: "Updated Label" } as any;
      const expected = { id: dto.id, label: "Updated Label" } as any;
      adminSuspensionService.update.mockResolvedValue(expected);

      const result = await controller.update(updateDto);

      expect(adminSuspensionService.update).toHaveBeenCalledWith(updateDto);
      expect(result).toBe(expected);
    });

    it("should throw when adminSuspensionService.update throws", async () => {
      const updateDto = { id: dto.id, label: "Updated" } as any;
      adminSuspensionService.update.mockRejectedValue(new NotFoundException("No encontrado"));

      await expect(controller.update(updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should call adminSuspensionService.delete with dto", async () => {
      adminSuspensionService.delete.mockResolvedValue(undefined);

      await controller.delete(dto);

      expect(adminSuspensionService.delete).toHaveBeenCalledWith(dto);
    });

    it("should throw when adminSuspensionService.delete throws", async () => {
      adminSuspensionService.delete.mockRejectedValue(new NotFoundException("No encontrado"));

      await expect(controller.delete(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
