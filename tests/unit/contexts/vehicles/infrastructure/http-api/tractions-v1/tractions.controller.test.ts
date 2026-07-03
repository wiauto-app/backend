import { createMock, Mock } from "@/tests/utils/mock";
import { TractionsController } from "@/contexts/vehicles/infrastructure/http-api/tractions-v1/tractions.controller";
import { TractionsUseCase } from "@/contexts/vehicles/application/tractions-use-cases/tractions.use-case";

describe("TractionsController", () => {
  let controller: TractionsController;
  let useCase: Mock<TractionsUseCase>;

  beforeEach(() => {
    useCase = createMock<TractionsUseCase>();
    controller = new TractionsController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto = { name: "4x4" };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto as any);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { name: "AWD" };
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
      const expected = [{ id: 1, name: "4x4" }];
      useCase.findAll.mockReturnValue(expected as any);

      const result = controller.findAll(query as any);

      expect(useCase.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty array when no tractions found", () => {
      useCase.findAll.mockReturnValue([]);

      const result = controller.findAll({} as any);

      expect(result).toEqual([]);
    });
  });

  describe("findOne", () => {
    it("should call use case findOne with id", () => {
      const expected = { id: 1, name: "4x4" };
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
      const dto = { name: "4x4" };
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
      const dto = { name: "AWD" };
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
