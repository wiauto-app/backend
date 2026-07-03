import { createMock, Mock } from "@/tests/utils/mock";
import { CatalogYearsController } from "@/contexts/vehicles/catalog/years/infrastructure/http-api/catalog-years-v1/catalog-years.controller";
import { CatalogYearsUseCase } from "@/contexts/vehicles/catalog/years/application/catalog-years-use-cases/catalog-years.use-case";
import { CreateCatalogYearHttpDto } from "@/contexts/vehicles/catalog/years/infrastructure/http-api/catalog-years-v1/dto/create-catalog-year.http-dto";

describe("CatalogYearsController", () => {
  let controller: CatalogYearsController;
  let useCase: Mock<CatalogYearsUseCase>;

  beforeEach(() => {
    useCase = createMock<CatalogYearsUseCase>();
    controller = new CatalogYearsController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto: CreateCatalogYearHttpDto = { year: 2024 };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { year: 2025 };
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

    it("should return empty array when no years found", () => {
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
      const dto: CreateCatalogYearHttpDto = { year: 2024 };
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
