import { createMock, Mock } from "@/tests/utils/mock";
import { FindAllDealershipsController } from "@/contexts/dealership/infrastructure/http-api/v1/find-all-dealerships/find-all-dealerships.controller";
import { FindAllDealershipUseCase } from "@/contexts/dealership/application/dealership/find-all-dealership-use-case/find-all-dealership.use-case";
import { FindAllDealershipsHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/find-all-dealerships/find-all-dealerships.http-dto";

describe("FindAllDealershipsController", () => {
  let controller: FindAllDealershipsController;
  let findAllDealershipUseCase: Mock<FindAllDealershipUseCase>;

  const query: FindAllDealershipsHttpDto = {
    page: 1,
    limit: 10,
    order_direction: "ASC",
    name: "Test",
    skip: 0,
  };
  const expectedResult = [{ id: "dealership-1" }];

  beforeEach(() => {
    findAllDealershipUseCase = createMock<FindAllDealershipUseCase>();
    controller = new FindAllDealershipsController(findAllDealershipUseCase);
  });

  it("should call use case with query", () => {
    findAllDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(query);

    expect(findAllDealershipUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Test" }),
    );
    expect(result).toBe(expectedResult);
  });

  it("should return empty array when no dealerships found", () => {
    findAllDealershipUseCase.execute.mockReturnValue([]);

    const result = controller.run(query);

    expect(result).toEqual([]);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findAllDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(query)).rejects.toThrow(error);
  });
});
