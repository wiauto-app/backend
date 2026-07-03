import { createMock, Mock } from "@/tests/utils/mock";
import { DeleteVehicleListController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/delete-vehicle-list/delete-vehicle-list.controller";
import { DeleteVehicleListUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/delete-vehicle-list-use-case/delete-vehicle-list.use-case";

describe("DeleteVehicleListController", () => {
  let controller: DeleteVehicleListController;
  let deleteVehicleListUseCase: Mock<DeleteVehicleListUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const expectedResult = undefined;

  beforeEach(() => {
    deleteVehicleListUseCase = createMock<DeleteVehicleListUseCase>();
    controller = new DeleteVehicleListController(deleteVehicleListUseCase);
  });

  it("should call use case with profile id and list id", () => {
    deleteVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id);

    expect(deleteVehicleListUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    deleteVehicleListUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id)).rejects.toThrow(error);
  });
});
