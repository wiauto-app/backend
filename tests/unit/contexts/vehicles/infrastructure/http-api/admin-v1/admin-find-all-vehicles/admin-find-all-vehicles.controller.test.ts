import { createMock, Mock } from "@/tests/utils/mock";
import { AdminFindAllVehiclesController } from "@/contexts/vehicles/infrastructure/http-api/admin-v1/admin-find-all-vehicles/admin-find-all-vehicles.controller";
import { AdminFindAllVehiclesUseCase } from "@/contexts/vehicles/application/admin-vehicles/admin-find-all-vehicles-use-case/admin-find-all-vehicles.use-case";

describe("AdminFindAllVehiclesController", () => {
  let controller: AdminFindAllVehiclesController;
  let adminFindAllVehiclesUseCase: Mock<AdminFindAllVehiclesUseCase>;

  const query = { page: 1, limit: 20, status: "active" };
  const expectedResult = { data: [], total: 0 };

  beforeEach(() => {
    adminFindAllVehiclesUseCase = createMock<AdminFindAllVehiclesUseCase>();
    controller = new AdminFindAllVehiclesController(adminFindAllVehiclesUseCase);
  });

  it("should call use case with query", () => {
    adminFindAllVehiclesUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(adminFindAllVehiclesUseCase.execute).toHaveBeenCalledWith(query);
    expect(result).toBe(expectedResult);
  });
});
