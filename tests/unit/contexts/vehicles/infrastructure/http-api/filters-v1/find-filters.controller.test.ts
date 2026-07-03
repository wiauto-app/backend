import { createMock, Mock } from "@/tests/utils/mock";
import { FindFiltersController } from "@/contexts/vehicles/infrastructure/http-api/filters-v1/find-filters.controller";
import { FindFiltersUseCase } from "@/contexts/vehicles/application/filters/find-filters-use-case/find-filters.use-case";

describe("FindFiltersController", () => {
  let controller: FindFiltersController;
  let findFiltersUseCase: Mock<FindFiltersUseCase>;

  beforeEach(() => {
    findFiltersUseCase = createMock<FindFiltersUseCase>();
    controller = new FindFiltersController(findFiltersUseCase);
  });

  it("should call use case and return result", () => {
    const expectedResult = { filters: ["brand", "model"] };
    findFiltersUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.findFilters();

    expect(findFiltersUseCase.execute).toHaveBeenCalledWith();
    expect(result).toBe(expectedResult);
  });

  it("should return empty filters when use case returns empty", () => {
    const expectedResult = { filters: [] };
    findFiltersUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.findFilters();

    expect(result).toEqual({ filters: [] });
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    findFiltersUseCase.execute.mockRejectedValue(error);

    await expect(controller.findFilters()).rejects.toThrow(error);
  });
});
