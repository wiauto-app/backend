import { createMock, Mock } from "@/tests/utils/mock";
import { CreateFeatureController } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/create-feature/create-feature.controller";
import { CreateFeatureUseCase } from "@/contexts/vehicles/application/features/create-feature-use-case/create-feature.use-case";
import { CreateFeatureHttpDto } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/create-feature/create-feature.http-dto";

describe("CreateFeatureController", () => {
  let controller: CreateFeatureController;
  let useCase: Mock<CreateFeatureUseCase>;

  beforeEach(() => {
    useCase = createMock<CreateFeatureUseCase>();
    controller = new CreateFeatureController(useCase);
  });

  it("should call use case execute with dto", () => {
    const dto: CreateFeatureHttpDto = { name: "Airbags" } as any;
    const expected = { id: 1 };
    useCase.execute.mockReturnValue(expected as any);

    const result = controller.run(dto);

    expect(useCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case fails", () => {
    const dto: CreateFeatureHttpDto = { name: "Airbags" } as any;
    const error = new Error("Use case error");
    useCase.execute.mockRejectedValue(error);

    expect(controller.run(dto)).rejects.toThrow(error);
  });
});
