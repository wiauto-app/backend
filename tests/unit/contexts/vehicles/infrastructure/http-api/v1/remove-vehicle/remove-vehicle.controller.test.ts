import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/remove-vehicle/remove-vehicle.controller";
import { RemoveVehicleUseCase } from "@/contexts/vehicles/application/vehicle/remove-vehicle-use-case/remove-vehicle.use-case";

describe("RemoveVehicleController", () => {
  let controller: RemoveVehicleController;
  let removeVehicleUseCase: Mock<RemoveVehicleUseCase>;

  const params = { id: "vehicle-1" };
  const expectedResult = undefined;

  beforeEach(() => {
    removeVehicleUseCase = createMock<RemoveVehicleUseCase>();
    controller = new RemoveVehicleController(removeVehicleUseCase);
  });

  it("should call use case with params id", async () => {
    removeVehicleUseCase.execute.mockResolvedValue(expectedResult);

    const result = await controller.run(params);

    expect(removeVehicleUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
    });
    expect(result).toBe(expectedResult);
  });
});
