import { createMock, Mock } from "@/tests/utils/mock";
import { CatalogModelsController } from "@/contexts/vehicles/catalog/models/infrastructure/http-api/catalog-models-v1/catalog-models.controller";
import { CatalogModelsUseCase } from "@/contexts/vehicles/catalog/models/application/catalog-models-use-cases/catalog-models.use-case";
import { CreateCatalogModelHttpDto } from "@/contexts/vehicles/catalog/models/infrastructure/http-api/catalog-models-v1/dto/create-catalog-model.http-dto";

describe("CatalogModelsController", () => {
  let controller: CatalogModelsController;
  let useCase: Mock<CatalogModelsUseCase>;

  beforeEach(() => {
    useCase = createMock<CatalogModelsUseCase>();
    controller = new CatalogModelsController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto: CreateCatalogModelHttpDto = { make_id: 1, model_id: 1, name: "Model X" };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { name: "Updated Model" };
      const expected = { id: 1 };
      useCase.update.mockReturnValue(expected as any);

      const result = controller.update(1, dto as any);

      expect(useCase.update).toHaveBeenCalledWith(1, dto);
      expect(result).toBe(expected);
    });
  });

  describe("findAll", () => {
    it("should call use case findAll with query", () => {
      const query = { page: 1, limit: 10, order_direction: "ASC" as const };
      const expected = [{ id: 1 }];
      useCase.findAll.mockReturnValue(expected as any);

      const result = controller.findAll(query as any);

      expect(useCase.findAll).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });

    it("should return empty array when no models found", () => {
      useCase.findAll.mockReturnValue([]);

      const result = controller.findAll({} as any);

      expect(result).toEqual([]);
    });
  });

  describe("findSearchModels", () => {
    it("should call use case findSearchModels with query", () => {
      const query = { make_id: 1, search: "model" };
      const expected = [{ id: 1 }];
      useCase.findSearchModels.mockReturnValue(expected as any);

      const result = controller.findSearchModels(query as any);

      expect(useCase.findSearchModels).toHaveBeenCalledWith(query);
      expect(result).toBe(expected);
    });
  });

  describe("findOne", () => {
    it("should call use case findOne with id", () => {
      const expected = { id: 1 };
      useCase.findOne.mockReturnValue(expected as any);

      const result = controller.findOne(1);

      expect(useCase.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(expected);
    });
  });

  describe("remove", () => {
    it("should call use case remove with id", async () => {
      useCase.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1);

      expect(useCase.remove).toHaveBeenCalledWith(1);
      expect(result).toBe(undefined);
    });
  });

  describe("error cases", () => {
    it("should throw when use case create throws", () => {
      const dto: CreateCatalogModelHttpDto = { make_id: 1, model_id: 1, name: "Model X" };
      const error = new Error("Use case error");
      useCase.create.mockRejectedValue(error);

      expect(controller.create(dto)).rejects.toThrow(error);
    });

    it("should throw when use case findOne throws", () => {
      const error = new Error("Use case error");
      useCase.findOne.mockRejectedValue(error);

      expect(controller.findOne(1)).rejects.toThrow(error);
    });
  });
});
