import { createMock, Mock } from "@/tests/utils/mock";
import { AddVehicleListItemController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/add-vehicle-list-item/add-vehicle-list-item.controller";
import { AddVehicleListItemUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/add-vehicle-list-item-use-case/add-vehicle-list-item.use-case";
import { AddVehicleListItemHttpDto } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/add-vehicle-list-item/add-vehicle-list-item.http-dto";

describe("AddVehicleListItemController", () => {
  let controller: AddVehicleListItemController;
  let addVehicleListItemUseCase: Mock<AddVehicleListItemUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const dto: AddVehicleListItemHttpDto = { vehicle_id: "vehicle-1" };
  const expectedResult = { id: "item-1" };

  beforeEach(() => {
    addVehicleListItemUseCase = createMock<AddVehicleListItemUseCase>();
    controller = new AddVehicleListItemController(addVehicleListItemUseCase);
  });

  it("should call use case with profile id, list id and dto", () => {
    addVehicleListItemUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id, dto);

    expect(addVehicleListItemUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
      vehicle_id: dto.vehicle_id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    addVehicleListItemUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id, dto)).rejects.toThrow(error);
  });
});
