import { createMock, Mock } from "@/tests/utils/mock";
import { AdminGetVehicleController } from "@/contexts/vehicles/infrastructure/http-api/admin-v1/admin-get-vehicle/admin-get-vehicle.controller";
import { AdminGetVehicleUseCase } from "@/contexts/vehicles/application/admin-vehicles/admin-get-vehicle-use-case/admin-get-vehicle.use-case";

describe("AdminGetVehicleController", () => {
  let controller: AdminGetVehicleController;
  let adminGetVehicleUseCase: Mock<AdminGetVehicleUseCase>;

  const params = { id: "vehicle-1" };
  const expectedResult = { id: "vehicle-1", price: 10000 };

  beforeEach(() => {
    adminGetVehicleUseCase = createMock<AdminGetVehicleUseCase>();
    controller = new AdminGetVehicleController(adminGetVehicleUseCase);
  });

  it("should call use case with params id", () => {
    adminGetVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params);

    expect(adminGetVehicleUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
    });
    expect(result).toBe(expectedResult);
  });
});
