import { createMock, Mock } from "@/tests/utils/mock";
import { DeleteCategoryController } from "@/contexts/vehicles/infrastructure/http-api/category-v1/delete-category/delete-category.controller";
import { DeleteCategoryUseCase } from "@/contexts/vehicles/application/category-use-cases/delete-category-use-case/delete-category.use-case";
import { DeleteCategoryHttpDto } from "@/contexts/vehicles/infrastructure/http-api/category-v1/delete-category/delete-category.http-dto";

describe("DeleteCategoryController", () => {
  let controller: DeleteCategoryController;
  let deleteCategoryUseCase: Mock<DeleteCategoryUseCase>;

  const dto: DeleteCategoryHttpDto = { id: "cat-1" };

  beforeEach(() => {
    deleteCategoryUseCase = createMock<DeleteCategoryUseCase>();
    controller = new DeleteCategoryController(deleteCategoryUseCase);
  });

  it("should call use case with dto and return result", () => {
    const expectedResult = undefined;
    deleteCategoryUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto);

    expect(deleteCategoryUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBeUndefined();
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    deleteCategoryUseCase.execute.mockRejectedValue(error);

    await expect(controller.run(dto)).rejects.toThrow(error);
  });
});
