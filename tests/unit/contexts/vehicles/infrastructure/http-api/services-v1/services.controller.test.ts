import { createMock, Mock } from "@/tests/utils/mock";
import { ServicesController } from "@/contexts/vehicles/infrastructure/http-api/services-v1/services.controller";
import { ServicesUseCase } from "@/contexts/vehicles/application/services-use-cases/services.use-case";

describe("ServicesController", () => {
  let controller: ServicesController;
  let useCase: Mock<ServicesUseCase>;

  beforeEach(() => {
    useCase = createMock<ServicesUseCase>();
    controller = new ServicesController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto = { name: "Oil Change" };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto as any);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { name: "Full Service" };
      const expected = { id: 1 };
      useCase.update.mockReturnValue(expected as any);

      const result = controller.update("1", dto as any);

      expect(useCase.update).toHaveBeenCalledWith("1", dto);
      expect(result).toBe(expected);
    });
  });

  describe("findAll", () => {
    it("should call use case findAll with query", () => {
      const query = { page: 1, limit: 10 };
      const expected = [{ id: 1, name: "Oil Change" }];
      useCase.findAll.mockReturnValue(expected as any);

      const result = controller.findAll(query as any);

      expect(useCase.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty array when no services found", () => {
      useCase.findAll.mockReturnValue([]);

      const result = controller.findAll({} as any);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should call use case findOne with id", () => {
      const expected = { id: 1, name: "Oil Change" };
      useCase.findOne.mockReturnValue(expected as any);

      const result = controller.findOne("1");

      expect(useCase.findOne).toHaveBeenCalledWith("1");
      expect(result).toBe(expected);
    });
  });

  describe("remove", () => {
    it("should call use case remove with id", async () => {
      useCase.remove.mockResolvedValue(undefined);

      const result = await controller.remove("1");

      expect(useCase.remove).toHaveBeenCalledWith("1");
      expect(result).toBe(undefined);
    });
  });

  describe("error cases", () => {
    it("should throw when use case create throws", () => {
      const dto = { name: "Oil Change" };
      const error = new Error("Use case error");
      useCase.create.mockRejectedValue(error);

      expect(controller.create(dto as any)).rejects.toThrow(error);
    });

    it("should throw when use case findOne throws", () => {
      const error = new Error("Use case error");
      useCase.findOne.mockRejectedValue(error);

      expect(controller.findOne("1")).rejects.toThrow(error);
    });

    it("should throw when use case update throws", () => {
      const dto = { name: "Full Service" };
      const error = new Error("Use case error");
      useCase.update.mockRejectedValue(error);

      expect(controller.update("1", dto as any)).rejects.toThrow(error);
    });

    it("should throw when use case remove throws", () => {
      const error = new Error("Use case error");
      useCase.remove.mockRejectedValue(error);

      expect(controller.remove("1")).rejects.toThrow(error);
    });
  });
});
