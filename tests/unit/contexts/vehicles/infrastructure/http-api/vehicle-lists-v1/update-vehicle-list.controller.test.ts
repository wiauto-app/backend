import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateVehicleListController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/update-vehicle-list/update-vehicle-list.controller";
import { UpdateVehicleListUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/update-vehicle-list-use-case/update-vehicle-list.use-case";
import { UpdateVehicleListHttpDto } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/update-vehicle-list/update-vehicle-list.http-dto";

describe("UpdateVehicleListController", () => {
  let controller: UpdateVehicleListController;
  let updateVehicleListUseCase: Mock<UpdateVehicleListUseCase>;

  const profile_id = "profile-1";
  const list_id = "list-1";
  const dto: UpdateVehicleListHttpDto = {
    name: "Updated Name",
    description: "Updated description",
    is_default: false,
  };
  const expectedResult = { id: list_id, name: "Updated Name" };

  beforeEach(() => {
    updateVehicleListUseCase = createMock<UpdateVehicleListUseCase>();
    controller = new UpdateVehicleListController(updateVehicleListUseCase);
  });

  it("should call use case with profile id, list id and dto", () => {
    updateVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id, dto);

    expect(updateVehicleListUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
      name: dto.name,
      description: dto.description,
      is_default: dto.is_default,
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with partial dto", () => {
    const partialDto = { name: "Only Name" };
    updateVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, list_id, partialDto as any);

    expect(updateVehicleListUseCase.execute).toHaveBeenCalledWith({
      list_id,
      profile_id,
      name: "Only Name",
      description: undefined,
      is_default: undefined,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    updateVehicleListUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, list_id, dto)).rejects.toThrow(error);
  });
});
