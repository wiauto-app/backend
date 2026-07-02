import { UnauthorizedException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { FindOwnerVehiclesController } from "@/contexts/vehicles/infrastructure/http-api/v1/find-owner-vehicles/find-owner-vehicles.controller";
import { FindOwnerVehiclesUseCase } from "@/contexts/vehicles/application/vehicle/find-owner-vehicles-use-case/find-owner-vehicles.use-case";

describe("FindOwnerVehiclesController", () => {
  let controller: FindOwnerVehiclesController;
  let findOwnerVehiclesUseCase: Mock<FindOwnerVehiclesUseCase>;

  const query = { status: "active", page: 1, limit: 10 };
  const user = { id: "user-1" };
  const req = { user } as any;
  const expectedResult = { data: [], total: 0 };

  beforeEach(() => {
    findOwnerVehiclesUseCase = createMock<FindOwnerVehiclesUseCase>();
    controller = new FindOwnerVehiclesController(findOwnerVehiclesUseCase);
  });

  it("should call use case with profile id and query", () => {
    findOwnerVehiclesUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query, req);

    expect(findOwnerVehiclesUseCase.execute).toHaveBeenCalledWith({
      profile_id: user.id,
      ...query,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw if user is not authenticated", () => {
    const reqWithoutUser = {} as any;

    expect(() => controller.run(query, reqWithoutUser)).toThrow(
      UnauthorizedException,
    );
    expect(findOwnerVehiclesUseCase.execute).not.toHaveBeenCalled();
  });
});
