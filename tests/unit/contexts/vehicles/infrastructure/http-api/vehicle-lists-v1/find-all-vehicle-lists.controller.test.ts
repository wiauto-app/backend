import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllVehicleListsController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/find-all-vehicle-lists/find-all-vehicle-lists.controller";
import { FindAllVehicleListsUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/find-all-vehicle-lists-use-case/find-all-vehicle-lists.use-case";

describe("FindAllVehicleListsController", () => {
  let controller: FindAllVehicleListsController;
  let findAllVehicleListsUseCase: Mock<FindAllVehicleListsUseCase>;

  const profile_id = "profile-1";
  const expectedResult = [{ id: "list-1", name: "Favorites" }];

  beforeEach(() => {
    findAllVehicleListsUseCase = createMock<FindAllVehicleListsUseCase>();
    controller = new FindAllVehicleListsController(findAllVehicleListsUseCase);
  });

  it("should call use case with profile id", () => {
    findAllVehicleListsUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id);

    expect(findAllVehicleListsUseCase.execute).toHaveBeenCalledWith({ profile_id });
    expect(result).toBe(expectedResult);
  });

  it("should return empty array when no lists found", () => {
    findAllVehicleListsUseCase.execute.mockReturnValue([]);

    const result = controller.run(profile_id);

    expect(result).toEqual([]);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findAllVehicleListsUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id)).rejects.toThrow(error);
  });
});
