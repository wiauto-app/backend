import { createMock, Mock } from "@/tests/utils/mock";
import { FindDealershipController } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership/find-one-dealership.controller";
import { FindOneDealershipUseCase } from "@/contexts/dealership/application/dealership/find-one-dealership-use-case/find-one-dealership.use-case";
import { FindDealershipHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership/find-one-dealership.http-dto";

describe("FindDealershipController", () => {
  let controller: FindDealershipController;
  let findOneDealershipUseCase: Mock<FindOneDealershipUseCase>;

  const params: FindDealershipHttpDto = { id: "dealership-1" };
  const expectedResult = { id: "dealership-1", name: "Test" };

  beforeEach(() => {
    findOneDealershipUseCase = createMock<FindOneDealershipUseCase>();
    controller = new FindDealershipController(findOneDealershipUseCase);
  });

  it("should call use case with id", () => {
    findOneDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params);

    expect(findOneDealershipUseCase.execute).toHaveBeenCalledWith({
      id: params.id,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findOneDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(params)).rejects.toThrow(error);
  });
});
