import { createMock, Mock } from "@/tests/utils/mock";
import { FindDealershipBySlugController } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership-by-slug/find-one-dealership-by-slug.controller";
import { FindOneDealershipBySlugUseCase } from "@/contexts/dealership/application/dealership/find-one-dealership-by-slug-use-case/find-one-dealership-by-slug.use-case";
import { FindDealershipBySlugHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/find-one-dealership-by-slug/find-one-dealership-by-slug.http-dto";

describe("FindDealershipBySlugController", () => {
  let controller: FindDealershipBySlugController;
  let findOneDealershipBySlugUseCase: Mock<FindOneDealershipBySlugUseCase>;

  const params: FindDealershipBySlugHttpDto = { slug: "my-dealership" };
  const expectedResult = { id: "dealership-1", slug: "my-dealership" };

  beforeEach(() => {
    findOneDealershipBySlugUseCase = createMock<FindOneDealershipBySlugUseCase>();
    controller = new FindDealershipBySlugController(findOneDealershipBySlugUseCase);
  });

  it("should call use case with slug", () => {
    findOneDealershipBySlugUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(params);

    expect(findOneDealershipBySlugUseCase.execute).toHaveBeenCalledWith({
      slug: params.slug,
    });
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    findOneDealershipBySlugUseCase.execute.mockRejectedValue(error);

    expect(controller.run(params)).rejects.toThrow(error);
  });
});
