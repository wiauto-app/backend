import { createMock, Mock } from "@/tests/utils/mock";
import { FindActiveFiltersController } from "@/contexts/vehicles/infrastructure/http-api/filters-v1/find-active-filters.controller";
import { FindActiveFiltersUseCase } from "@/contexts/vehicles/application/filters/find-active-filters-use-case/find-active-filters.use-case";
import { FindActiveFiltersHttpDto } from "@/contexts/vehicles/infrastructure/http-api/filters-v1/find-active-filters.http-dto";

describe("FindActiveFiltersController", () => {
  let controller: FindActiveFiltersController;
  let findActiveFiltersUseCase: Mock<FindActiveFiltersUseCase>;

  const dto: FindActiveFiltersHttpDto = { isActive: true };

  beforeEach(() => {
    findActiveFiltersUseCase = createMock<FindActiveFiltersUseCase>();
    controller = new FindActiveFiltersController(findActiveFiltersUseCase);
  });

  it("should call use case with dto and return result", () => {
    const expectedResult = { filters: ["brand", "model"] };
    findActiveFiltersUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.findActiveFilters(dto);

    expect(findActiveFiltersUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResult);
  });

  it("should return empty active filters when use case returns empty", () => {
    const expectedResult = { filters: [] };
    findActiveFiltersUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.findActiveFilters(dto);

    expect(result).toEqual({ filters: [] });
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    findActiveFiltersUseCase.execute.mockRejectedValue(error);

    await expect(controller.findActiveFilters(dto)).rejects.toThrow(error);
  });
});
