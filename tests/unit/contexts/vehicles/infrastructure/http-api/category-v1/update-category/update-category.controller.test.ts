import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateCategoryController } from "@/contexts/vehicles/infrastructure/http-api/category-v1/update-category/update-category.controller";
import { UpdateCategoryUseCase } from "@/contexts/vehicles/application/category-use-cases/update-category-use-case/update-category.use-case";
import { UpdateCategoryHttpDto } from "@/contexts/vehicles/infrastructure/http-api/category-v1/update-category/update-category.http-dto";

describe("UpdateCategoryController", () => {
  let controller: UpdateCategoryController;
  let updateCategoryUseCase: Mock<UpdateCategoryUseCase>;

  const dto: UpdateCategoryHttpDto = { id: "cat-1", name: "Updated SUV" };

  beforeEach(() => {
    updateCategoryUseCase = createMock<UpdateCategoryUseCase>();
    controller = new UpdateCategoryController(updateCategoryUseCase);
  });

  it("should call use case with dto and return result", () => {
    const expectedResult = { id: "cat-1", name: "Updated SUV" };
    updateCategoryUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto);

    expect(updateCategoryUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    updateCategoryUseCase.execute.mockRejectedValue(error);

    await expect(controller.run(dto)).rejects.toThrow(error);
  });
});
