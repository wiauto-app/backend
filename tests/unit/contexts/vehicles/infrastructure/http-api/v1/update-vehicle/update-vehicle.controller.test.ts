import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/update-vehicle/update-vehicle.controller";
import { UpdateVehicleUseCase } from "@/contexts/vehicles/application/vehicle/update-vehicle-use-case/update-vehicle.use-case";

describe("UpdateVehicleController", () => {
  let controller: UpdateVehicleController;
  let updateVehicleUseCase: Mock<UpdateVehicleUseCase>;

  const id = "vehicle-1";
  const body = { price: 15000 } as any;
  const expectedResult = { id: "vehicle-1", price: 15000 };

  beforeEach(() => {
    updateVehicleUseCase = createMock<UpdateVehicleUseCase>();
    controller = new UpdateVehicleController(updateVehicleUseCase);
  });

  it("should call use case with id and body", () => {
    updateVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(id, body);

    expect(updateVehicleUseCase.execute).toHaveBeenCalledWith({
      id,
      ...body,
    });
    expect(result).toBe(expectedResult);
  });
});
