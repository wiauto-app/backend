import { createMock, Mock } from "@/tests/utils/mock";
import { FindFeatureController } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/find-feature/find-feature.controller";
import { FindFeatureUseCase } from "@/contexts/vehicles/application/features/find-feature-use-case/find-feature.use-case";

describe("FindFeatureController", () => {
  let controller: FindFeatureController;
  let useCase: Mock<FindFeatureUseCase>;

  beforeEach(() => {
    useCase = createMock<FindFeatureUseCase>();
    controller = new FindFeatureController(useCase);
  });

  it("should call use case execute with param dto", () => {
    const dto = { id: "1" };
    const expected = { id: 1, name: "Airbags" };
    useCase.execute.mockReturnValue(expected as any);

    const result = controller.run(dto as any);

    expect(useCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case fails", () => {
    const dto = { id: "1" };
    const error = new Error("Use case error");
    useCase.execute.mockRejectedValue(error);

    expect(controller.run(dto as any)).rejects.toThrow(error);
  });
});
