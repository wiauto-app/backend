import { UnauthorizedException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { CreateVehicleController } from "@/contexts/vehicles/infrastructure/http-api/v1/create-vehicle/create-vehicle.controller";
import { CreateVehicleUseCase } from "@/contexts/vehicles/application/vehicle/create-vehicle-use-case/create-vehicle.use-case";

describe("CreateVehicleController", () => {
  let controller: CreateVehicleController;
  let createVehicleUseCase: Mock<CreateVehicleUseCase>;

  const dto = { price: 10000, mileage: 50000 } as any;
  const user = { id: "user-1" };
  const req = { user } as any;
  const expectedResult = { id: "vehicle-1" };

  beforeEach(() => {
    createVehicleUseCase = createMock<CreateVehicleUseCase>();
    controller = new CreateVehicleController(createVehicleUseCase);
  });

  it("should call use case with dto and user id", () => {
    createVehicleUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto, req);

    expect(createVehicleUseCase.execute).toHaveBeenCalledWith(dto, "user-1");
    expect(result).toBe(expectedResult);
  });

  it("should throw if user is not authenticated", () => {
    const reqWithoutUser = {} as any;

    expect(() => controller.run(dto, reqWithoutUser)).toThrow(
      UnauthorizedException,
    );
    expect(createVehicleUseCase.execute).not.toHaveBeenCalled();
  });
});
