import { createMock, Mock } from "@/tests/utils/mock";
import { UpdateDealershipController } from "@/contexts/dealership/infrastructure/http-api/v1/update-dealership/update-dealership.controller";
import { UpdateDealershipUseCase } from "@/contexts/dealership/application/dealership/update-dealership-use-case/update-dealership.use-case";
import { FindDealershipHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership/find-one-dealership.http-dto";

describe("UpdateDealershipController", () => {
  let controller: UpdateDealershipController;
  let updateDealershipUseCase: Mock<UpdateDealershipUseCase>;

  const params: FindDealershipHttpDto = { id: "dealership-1" };
  const expectedResult = { id: "dealership-1" };

  beforeEach(() => {
    updateDealershipUseCase = createMock<UpdateDealershipUseCase>();
    controller = new UpdateDealershipController(updateDealershipUseCase);
  });

  it("should call use case with id and partial fields", () => {
    const dto = { name: "Updated", description: "New description" };
    updateDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params, dto as any);

    expect(updateDealershipUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
      name: "Updated",
      description: "New description",
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case with mapped members when provided", () => {
    const dto = {
      name: "Updated",
      members: [{ profile_id: "profile-2", role: "admin" as const }],
    };
    updateDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params, dto as any);

    expect(updateDealershipUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
      name: "Updated",
      members: [{ profile_id: "profile-2", role: "admin" }],
    });
    expect(result).toBe(expectedResult);
  });

  it("should call use case without members when not provided", () => {
    const dto = { name: "Updated" };
    updateDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params, dto as any);

    expect(updateDealershipUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
      name: "Updated",
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const dto = { name: "Updated" };
    const error = new Error("Use case error");
    updateDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(params, dto as any)).rejects.toThrow(error);
  });
});
