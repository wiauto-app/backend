import { createMock, Mock } from "@/tests/utils/mock";
import { CatalogFuelTypesController } from "@/contexts/vehicles/catalog/fuel_types/infrastructure/http-api/catalog-fuel-types-v1/catalog-fuel-types.controller";
import { CatalogFuelTypesUseCase } from "@/contexts/vehicles/catalog/fuel_types/application/catalog-fuel-types-use-cases/catalog-fuel-types.use-case";
import { CreateCatalogFuelTypeHttpDto } from "@/contexts/vehicles/catalog/fuel_types/infrastructure/http-api/catalog-fuel-types-v1/dto/create-catalog-fuel-type.http-dto";

describe("CatalogFuelTypesController", () => {
  let controller: CatalogFuelTypesController;
  let useCase: Mock<CatalogFuelTypesUseCase>;

  beforeEach(() => {
    useCase = createMock<CatalogFuelTypesUseCase>();
    controller = new CatalogFuelTypesController(useCase);
  });

  describe("create", () => {
    it("should call use case create with dto", () => {
      const dto: CreateCatalogFuelTypeHttpDto = { fuel_id: 1, name: "Gasoline", can_charge: true };
      const expected = { id: 1 };
      useCase.create.mockReturnValue(expected as any);

      const result = controller.create(dto);

      expect(useCase.create).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe("update", () => {
    it("should call use case update with id and dto", () => {
      const dto = { name: "Diesel" };
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

    it("should return empty array when no fuel types found", () => {
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
      const dto: CreateCatalogFuelTypeHttpDto = { fuel_id: 1, name: "Gasoline", can_charge: true };
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
