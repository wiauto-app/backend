import { createMock, Mock } from "@/tests/utils/mock";
import { DuplicateVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/duplicate-vehicle/duplicate-vehicle.controller";
import { DuplicateVehicleUseCase } from "@/contexts/vehicles/application/vehicle/duplicate-vehicle-use-case/duplicate-vehicle.use-case";

describe("DuplicateVehicleController", () => {
  let controller: DuplicateVehicleController;
  let duplicateVehicleUseCase: Mock<DuplicateVehicleUseCase>;

  const id = "vehicle-1";
  const expectedResult = { id: "vehicle-2" };

  beforeEach(() => {
    duplicateVehicleUseCase = createMock<DuplicateVehicleUseCase>();
    controller = new DuplicateVehicleController(duplicateVehicleUseCase);
  });

  it("should call use case with vehicle id", () => {
    duplicateVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id);

    expect(duplicateVehicleUseCase.execute).toHaveBeenCalledWith({
      vehicle_id: id,
    });
    expect(result).toBe(expectedResult);
  });
});
