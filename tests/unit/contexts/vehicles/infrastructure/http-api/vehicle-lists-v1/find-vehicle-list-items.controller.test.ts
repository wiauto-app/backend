import { createMock, Mock } from "@/tests/utils/mock";
import { FindVehicleListItemsController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/find-vehicle-list-items/find-vehicle-list-items.controller";
import { FindVehicleListItemsUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/find-vehicle-list-items-use-case/find-vehicle-list-items.use-case";

describe("FindVehicleListItemsController", () => {
  let controller: FindVehicleListItemsController;
  let findVehicleListItemsUseCase: Mock<FindVehicleListItemsUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const expectedResult = [{ vehicle_id: "vehicle-1" }];

  beforeEach(() => {
    findVehicleListItemsUseCase = createMock<FindVehicleListItemsUseCase>();
    controller = new FindVehicleListItemsController(findVehicleListItemsUseCase);
  });

  it("should call use case with profile id and list id", () => {
    findVehicleListItemsUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id);

    expect(findVehicleListItemsUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should return empty array when no items found", () => {
    findVehicleListItemsUseCase.execute.mockReturnValue([]);

    const result = controller.run(profile_id, list_id);

    expect(result).toEqual([]);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findVehicleListItemsUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id)).rejects.toThrow(error);
  });
});
