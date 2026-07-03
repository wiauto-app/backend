import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveVehicleListItemController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/remove-vehicle-list-item/remove-vehicle-list-item.controller";
import { RemoveVehicleListItemUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/remove-vehicle-list-item-use-case/remove-vehicle-list-item.use-case";

describe("RemoveVehicleListItemController", () => {
  let controller: RemoveVehicleListItemController;
  let removeVehicleListItemUseCase: Mock<RemoveVehicleListItemUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const vehicle_id = "vehicle-1";
  const expectedResult = undefined;

  beforeEach(() => {
    removeVehicleListItemUseCase = createMock<RemoveVehicleListItemUseCase>();
    controller = new RemoveVehicleListItemController(removeVehicleListItemUseCase);
  });

  it("should call use case with profile id, list id and vehicle id", () => {
    removeVehicleListItemUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id, vehicle_id);

    expect(removeVehicleListItemUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
      vehicle_id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    removeVehicleListItemUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id, vehicle_id)).rejects.toThrow(error);
  });
});
