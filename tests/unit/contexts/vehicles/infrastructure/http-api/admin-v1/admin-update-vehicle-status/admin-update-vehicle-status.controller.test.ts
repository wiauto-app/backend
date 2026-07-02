import { createMock, Mock } from "@/tests/utils/mock";
import { AdminUpdateVehicleStatusController } from "@/contexts/vehicles/infrastructure/http-api/admin-v1/admin-update-vehicle-status/admin-update-vehicle-status.controller";
import { AdminUpdateVehicleStatusUseCase } from "@/contexts/vehicles/application/admin-vehicles/admin-update-vehicle-status-use-case/admin-update-vehicle-status.use-case";

describe("AdminUpdateVehicleStatusController", () => {
  let controller: AdminUpdateVehicleStatusController;
  let adminUpdateVehicleStatusUseCase: Mock<AdminUpdateVehicleStatusUseCase>;

  const id = "550e8400-e29b-41d4-a716-446655440000";
  const body = { status: "approved", message: "Vehicle approved" };
  const expectedResult = { id, status: "approved" };

  beforeEach(() => {
    adminUpdateVehicleStatusUseCase = createMock<AdminUpdateVehicleStatusUseCase>();
    controller = new AdminUpdateVehicleStatusController(adminUpdateVehicleStatusUseCase);
  });

  it("should call use case with vehicle id, status and message", () => {
    adminUpdateVehicleStatusUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id, body);

    expect(adminUpdateVehicleStatusUseCase.execute).toHaveBeenCalledWith({
      vehicle_id: id,
      status: body.status,
      message: body.message,
    });
    expect(result).toBe(expectedResult);
  });
});
