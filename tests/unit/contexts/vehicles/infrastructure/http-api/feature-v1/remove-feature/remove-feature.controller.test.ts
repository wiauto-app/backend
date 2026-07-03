import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveFeatureController } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/remove-feature/remove-feature.controller";
import { RemoveFeatureUseCase } from "@/contexts/vehicles/application/features/remove-feature-use-case/remove-feature.use-case";

describe("RemoveFeatureController", () => {
  let controller: RemoveFeatureController;
  let useCase: Mock<RemoveFeatureUseCase>;

  beforeEach(() => {
    useCase = createMock<RemoveFeatureUseCase>();
    controller = new RemoveFeatureController(useCase);
  });

  it("should call use case execute with param dto", async () => {
    const dto = { id: "1" };
    useCase.execute.mockResolvedValue(undefined);

    const result = await controller.run(dto as any);

    expect(useCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(undefined);
  });

  it("should throw when use case fails", () => {
    const dto = { id: "1" };
    const error = new Error("Use case error");
    useCase.execute.mockRejectedValue(error);

    expect(controller.run(dto as any)).rejects.toThrow(error);
  });
});
