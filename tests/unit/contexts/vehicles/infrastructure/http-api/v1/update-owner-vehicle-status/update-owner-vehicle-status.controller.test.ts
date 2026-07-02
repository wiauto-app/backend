import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateOwnerVehicleStatusController } from "@/contexts/vehicles/infrastructure/http-api/v1/update-owner-vehicle-status/update-owner-vehicle-status.controller";
import { UpdateOwnerVehicleStatusUseCase } from "@/contexts/vehicles/application/vehicle/update-owner-vehicle-status-use-case/update-owner-vehicle-status.use-case";

describe("UpdateOwnerVehicleStatusController", () => {
  let controller: UpdateOwnerVehicleStatusController;
  let useCase: Mock<UpdateOwnerVehicleStatusUseCase>;

  const id = "vehicle-1";
  const body = { status: "active" } as any;
  const expectedResult = { id: "vehicle-1", status: "active" };

  beforeEach(() => {
    useCase = createMock<UpdateOwnerVehicleStatusUseCase>();
    controller = new UpdateOwnerVehicleStatusController(useCase);
  });

  it("should call use case with vehicle id and status", () => {
    useCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id, body);

    expect(useCase.execute).toHaveBeenCalledWith({
      vehicle_id: id,
      status: body.status,
    });
    expect(result).toBe(expectedResult);
  });
});
