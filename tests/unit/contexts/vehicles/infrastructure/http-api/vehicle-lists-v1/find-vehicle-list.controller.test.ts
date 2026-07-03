import { createMock, Mock } from "@/tests/utils/mock";
import { FindVehicleListController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/find-vehicle-list/find-vehicle-list.controller";
import { FindVehicleListUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/find-vehicle-list-use-case/find-vehicle-list.use-case";

describe("FindVehicleListController", () => {
  let controller: FindVehicleListController;
  let findVehicleListUseCase: Mock<FindVehicleListUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const expectedResult = { id: list_id, name: "Favorites" };

  beforeEach(() => {
    findVehicleListUseCase = createMock<FindVehicleListUseCase>();
    controller = new FindVehicleListController(findVehicleListUseCase);
  });

  it("should call use case with profile id and list id", () => {
    findVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id);

    expect(findVehicleListUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findVehicleListUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id)).rejects.toThrow(error);
  });
});
