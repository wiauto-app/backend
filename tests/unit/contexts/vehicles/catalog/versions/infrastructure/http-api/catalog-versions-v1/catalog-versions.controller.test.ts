import { createMock, Mock } from "@/tests/utils/mock";
import { CatalogVersionsController } from "@/contexts/vehicles/catalog/versions/infrastructure/http-api/catalog-versions-v1/catalog-versions.controller";
import { CatalogVersionsUseCase } from "@/contexts/vehicles/catalog/versions/application/catalog-versions-use-cases/catalog-versions.use-case";
import { CreateCatalogVersionHttpDto } from "@/contexts/vehicles/catalog/versions/infrastructure/http-api/catalog-versions-v1/dto/create-catalog-version.http-dto";

describe("CatalogVersionsController", () => {
  let controller: CatalogVersionsController;
  let useCase: Mock<CatalogVersionsUseCase>;

  beforeEach(() => {
    useCase = createMock<CatalogVersionsUseCase>();
    controller = new CatalogVersionsController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto: CreateCatalogVersionHttpDto = {
        make_id: 1, model_id: 1, body_type_id: 1, fuel_type_id: 1, year_id: 1, name: "V1",
      };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { name: "Updated Version" };
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

    it("should return empty array when no versions found", () => {
      useCase.findAll.mockReturnValue([]);

      const result = controller.findAll({} as any);

      expect(result).toEqual([]);
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
      const dto: CreateCatalogVersionHttpDto = {
        make_id: 1, model_id: 1, body_type_id: 1, fuel_type_id: 1, year_id: 1, name: "V1",
      };
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
