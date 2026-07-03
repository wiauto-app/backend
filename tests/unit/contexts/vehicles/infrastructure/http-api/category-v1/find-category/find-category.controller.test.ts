import { createMock, Mock } from "@/tests/utils/mock";
import { FindCategoryController } from "@/contexts/vehicles/infrastructure/http-api/category-v1/find-category/find-category.controller";
import { FindCategoryUseCase } from "@/contexts/vehicles/application/category-use-cases/find-category-use-case/find-category.use-case";
import { FindCategoryHttpDto } from "@/contexts/vehicles/infrastructure/http-api/category-v1/find-category/find-category.http-dto";

describe("FindCategoryController", () => {
  let controller: FindCategoryController;
  let findCategoryUseCase: Mock<FindCategoryUseCase>;

  const dto: FindCategoryHttpDto = { id: "cat-1" };

  beforeEach(() => {
    findCategoryUseCase = createMock<FindCategoryUseCase>();
    controller = new FindCategoryController(findCategoryUseCase);
  });

  it("should call use case with dto and return result", () => {
    const expectedResult = { id: "cat-1", name: "SUV" };
    findCategoryUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto);

    expect(findCategoryUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    findCategoryUseCase.execute.mockRejectedValue(error);

    await expect(controller.run(dto)).rejects.toThrow(error);
  });
});
