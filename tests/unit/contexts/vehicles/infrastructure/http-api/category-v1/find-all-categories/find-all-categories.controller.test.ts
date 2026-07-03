import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllCategoriesController } from "@/contexts/vehicles/infrastructure/http-api/category-v1/find-all-categories/find-all-categories.controller";
import { FindAllCategoriesUseCase } from "@/contexts/vehicles/application/category-use-cases/find-all-categories-use-case/find-all-categories.use-case";
import { PaginationHttpDto } from "@/contexts/shared/infrastructure/http-dtos/pagination.http-dto";

describe("FindAllCategoriesController", () => {
  let controller: FindAllCategoriesController;
  let findAllCategoriesUseCase: Mock<FindAllCategoriesUseCase>;

  const query: PaginationHttpDto = { page: 1, limit: 20 };

  beforeEach(() => {
    findAllCategoriesUseCase = createMock<FindAllCategoriesUseCase>();
    controller = new FindAllCategoriesController(findAllCategoriesUseCase);
  });

  it("should call use case with query and return result", () => {
    const expectedResult = { data: [{ id: "cat-1", name: "SUV" }], total: 1 };
    findAllCategoriesUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(findAllCategoriesUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBe(expectedResult);
  });

  it("should return empty list when no categories exist", () => {
    const expectedResult = { data: [], total: 0 };
    findAllCategoriesUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(result).toEqual({ data: [], total: 0 });
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    findAllCategoriesUseCase.execute.mockRejectedValue(error);

    await expect(controller.run(query)).rejects.toThrow(error);
  });
});
