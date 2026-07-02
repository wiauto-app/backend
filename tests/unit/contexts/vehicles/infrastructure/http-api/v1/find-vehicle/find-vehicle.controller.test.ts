import { createMock, Mock } from "@/tests/utils/mock";
import { FindVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/find-vehicle/find-vehicle.controller";
import { GetVehicleUseCase } from "@/contexts/vehicles/application/vehicle/get-vehicle-use-case/get-vehicle.use-case";

describe("FindVehicleController", () => {
  let controller: FindVehicleController;
  let getVehicleUseCase: Mock<GetVehicleUseCase>;

  const params = { id: "vehicle-1" };
  const expectedResult = { id: "vehicle-1", price: 10000 };

  beforeEach(() => {
    getVehicleUseCase = createMock<GetVehicleUseCase>();
    controller = new FindVehicleController(getVehicleUseCase);
  });

  it("should call use case with params", () => {
    getVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params);

    expect(getVehicleUseCase.execute).toHaveBeenCalledWith(params);
    expect(result).toBe(expectedResult);
  });
});
