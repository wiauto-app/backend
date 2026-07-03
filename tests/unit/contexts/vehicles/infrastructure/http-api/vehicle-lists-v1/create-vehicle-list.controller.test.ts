import { createMock, Mock } from "@/tests/utils/mock";
import { CreateVehicleListController } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/create-vehicle-list/create-vehicle-list.controller";
import { CreateVehicleListUseCase } from "@/contexts/vehicles/application/vehicle-list-use-cases/create-vehicle-list-use-case/create-vehicle-list.use-case";
import { CreateVehicleListHttpDto } from "@/contexts/vehicles/infrastructure/http-api/vehicle-lists-v1/create-vehicle-list/create-vehicle-list.http-dto";

describe("CreateVehicleListController", () => {
  let controller: CreateVehicleListController;
  let createVehicleListUseCase: Mock<CreateVehicleListUseCase>;

  const profile_id = "profile-1";
  const dto: CreateVehicleListHttpDto = {
    name: "Favorites",
    description: "My favorite cars",
    is_default: true,
  };
  const expectedResult = { id: "list-1" };

  beforeEach(() => {
    createVehicleListUseCase = createMock<CreateVehicleListUseCase>();
    controller = new CreateVehicleListController(createVehicleListUseCase);
  });

  it("should call use case with profile id and dto", () => {
    createVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, dto);

    expect(createVehicleListUseCase.execute).toHaveBeenCalledWith({
      profile_id,
      name: dto.name,
      description: dto.description,
      is_default: dto.is_default,
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with optional fields omitted", () => {
    const minimalDto = { name: "Favorites" };
    createVehicleListUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, minimalDto as any);

    expect(createVehicleListUseCase.execute).toHaveBeenCalledWith({
      profile_id,
      name: "Favorites",
      description: undefined,
      is_default: undefined,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    createVehicleListUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, dto)).rejects.toThrow(error);
  });
});
