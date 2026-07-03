import { createMock, Mock } from "@/tests/utils/mock";
import { FindFeaturesController } from "@/contexts/vehicles/infrastructure/http-api/feature-v1/find-features/find-features.controller";
import { FindFeaturesUseCase } from "@/contexts/vehicles/application/features/find-features-use-case/find-features.use-case";

describe("FindFeaturesController", () => {
  let controller: FindFeaturesController;
  let useCase: Mock<FindFeaturesUseCase>;

  beforeEach(() => {
    useCase = createMock<FindFeaturesUseCase>();
    controller = new FindFeaturesController(useCase);
  });

  it("should call use case execute with query dto", () => {
    const dto = { page: 1, limit: 10 };
    const expected = [{ id: 1, name: "Airbags" }];
    useCase.execute.mockReturnValue(expected as any);

    const result = controller.run(dto as any);

    expect(useCase.execute).toHaveBeenCalledWith(dto);
    expect(result).toBe(expected);
  });

  it("should return empty array when no features found", () => {
    const dto = { page: 1, limit: 10 };
    useCase.execute.mockReturnValue([]);

    const result = controller.run(dto as any);

    expect(result).toEqual([]);
  });

  it("should throw when use case fails", () => {
    const dto = { page: 1, limit: 10 };
    const error = new Error("Use case error");
    useCase.execute.mockRejectedValue(error);

    expect(controller.run(dto as any)).rejects.toThrow(error);
  });
});
