import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateFeatureController } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/update-feature/update-feature.controller";
import { UpdateFeatureUseCase } from "@/contexts/vehicles/application/features/update-feature-use-case/update-feature.use-case";

describe("UpdateFeatureController", () => {
  let controller: UpdateFeatureController;
  let useCase: Mock<UpdateFeatureUseCase>;

  beforeEach(() => {
    useCase = createMock<UpdateFeatureUseCase>();
    controller = new UpdateFeatureController(useCase);
  });

  it("should call use case execute with body dto", () => {
    const dto = { id: "1", name: "Updated Feature" };
    const expected = { id: 1, name: "Updated Feature" };
    useCase.execute.mockReturnValue(expected as any);

    const result = controller.run(dto as any);

    expect(useCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should throw when use case fails", () => {
    const dto = { id: "1", name: "Updated Feature" };
    const error = new Error("Use case error");
    useCase.execute.mockRejectedValue(error);

    expect(controller.run(dto as any)).rejects.toThrow(error);
  });
});
