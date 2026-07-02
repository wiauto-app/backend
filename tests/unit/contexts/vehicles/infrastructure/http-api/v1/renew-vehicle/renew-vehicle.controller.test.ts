import { createMock, Mock } from "@/tests/utils/mock";
import { RenewVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/renew-vehicle/renew-vehicle.controller";
import { RenewVehicleUseCase } from "@/contexts/vehicles/application/vehicle/renew-vehicle-use-case/renew-vehicle.use-case";

describe("RenewVehicleController", () => {
  let controller: RenewVehicleController;
  let renewVehicleUseCase: Mock<RenewVehicleUseCase>;

  const id = "vehicle-1";
  const expectedResult = { id: "vehicle-1", expires_at: new Date() };

  beforeEach(() => {
    renewVehicleUseCase = createMock<RenewVehicleUseCase>();
    controller = new RenewVehicleController(renewVehicleUseCase);
  });

  it("should call use case with vehicle id", () => {
    renewVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id);

    expect(renewVehicleUseCase.execute).toHaveBeenCalledWith({
      vehicle_id: id,
    });
    expect(result).toBe(expectedResult);
  });
});
