import { createMock, Mock } from "@/tests/utils/mock";
import { CreateCategoryController } from "@/contexts/vehicles/infrastructure/http-api/category-v1/create-category/create-category.controller";
import { CreateCategoryUseCase } from "@/contexts/vehicles/application/category-use-cases/create-category-use-case/create-category.use-case";
import { CreateCategoryHttpDto } from "@/contexts/vehicles/infrastructure/http-api/category-v1/create-category/create-category.http-dto";

describe("CreateCategoryController", () => {
  let controller: CreateCategoryController;
  let createCategoryUseCase: Mock<CreateCategoryUseCase>;

  const dto: CreateCategoryHttpDto = { name: "SUV" };

  beforeEach(() => {
    createCategoryUseCase = createMock<CreateCategoryUseCase>();
    controller = new CreateCategoryController(createCategoryUseCase);
  });

  it("should call use case with dto and return result", () => {
    const expectedResult = { id: "cat-1", name: "SUV" };
    createCategoryUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto);

    expect(createCategoryUseCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case fails", async () => {
    const error = new Error("use case error");
    createCategoryUseCase.execute.mockRejectedValue(error);

    await expect(controller.run(dto)).rejects.toThrow(error);
  });
});
