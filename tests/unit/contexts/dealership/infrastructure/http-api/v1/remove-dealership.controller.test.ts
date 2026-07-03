import { createMock, Mock } from "@/tests/utils/mock";
import { RemoveDealershipController } from "@/contexts/dealership/infrastructure/http-api/v1/remove-dealership/remove-dealership.controller";
import { RemoveDealershipUseCase } from "@/contexts/dealership/application/dealership/remove-dealership-use-case/remove-dealership.use-case";
import { FindDealershipHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership/find-one-dealership.http-dto";

describe("RemoveDealershipController", () => {
  let controller: RemoveDealershipController;
  let removeDealershipUseCase: Mock<RemoveDealershipUseCase>;

  const params: FindDealershipHttpDto = { id: "dealership-1" };

  beforeEach(() => {
    removeDealershipUseCase = createMock<RemoveDealershipUseCase>();
    controller = new RemoveDealershipController(removeDealershipUseCase);
  });

  it("should call use case with id", async () => {
    removeDealershipUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.run(params);

    expect(removeDealershipUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
    });
    expect(result).toBe(undefined);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    removeDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(params)).rejects.toThrow(error);
  });
});
