import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllVehiclesController } from "@/contexts/vehicles/infrastructure/http-api/v1/find-all-vehicles/find-all-vehicles.controller";
import { FindAllVehiclesUseCase } from "@/contexts/vehicles/application/vehicle/find-all-vehicles-use-case/find-all-vehicles.use-case";

describe("FindAllVehiclesController", () => {
  let controller: FindAllVehiclesController;
  let findAllVehiclesUseCase: Mock<FindAllVehiclesUseCase>;

  const query = { page: 1, limit: 20 };
  const expectedResult = { data: [], total: 0 };

  beforeEach(() => {
    findAllVehiclesUseCase = createMock<FindAllVehiclesUseCase>();
    controller = new FindAllVehiclesController(findAllVehiclesUseCase);
  });

  it("should call use case with query", () => {
    findAllVehiclesUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(findAllVehiclesUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBe(expectedResult);
  });
});
