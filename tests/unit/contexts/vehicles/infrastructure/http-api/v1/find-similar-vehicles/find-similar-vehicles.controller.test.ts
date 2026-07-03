import { createMock, Mock } from "@/tests/utils/mock";
import { FindSimilarVehiclesController } from "@/contexts/vehicles/infrastructure/http-api/v1/find-similar-vehicles/find-similar-vehicles.controller";
import { FindSimilarVehiclesUseCase } from "@/contexts/vehicles/application/vehicle/find-similar-vehicles-use-case/find-similar-vehicles.use-case";

describe("FindSimilarVehiclesController", () => {
  let controller: FindSimilarVehiclesController;
  let useCase: Mock<FindSimilarVehiclesUseCase>;

  const params = { id: "vehicle-123" };
  const query = { page: 2, limit: 5 };
  const expectedResult = { data: [], total: 0 };

  beforeEach(() => {
    useCase = createMock<FindSimilarVehiclesUseCase>();
    controller = new FindSimilarVehiclesController(useCase);
  });

  it("should call use case with vehicle_id, page, and limit", async () => {
    useCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.run(params, query);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: params.id,
      page: query.page,
      limit: query.limit,
    });
    expect(result).toBe(expectedResult);
  });

  it("should propagate error when use case fails", async () => {
    const error = new Error("use case error");
    useCase.execute.mockRejectedValue(error);

    await expect(controller.run(params, query)).rejects.toThrow(error);
  });

  it("should handle empty results", async () => {
    const emptyResult = { data: [], total: 0 };
    useCase.execute.mockResolvedValue(emptyResult);

    const result = await controller.run(params, query);

    expect(result).toEqual(emptyResult);
  });
});
