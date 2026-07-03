import { createMock, Mock } from "@/tests/utils/mock";
import { CreateMyDealershipController } from "@/contexts/dealership/infrastructure/http-api/v1/create-my-dealership/create-my-dealership.controller";
import { CreateMyDealershipUseCase } from "@/contexts/dealership/application/dealership/create-my-dealership-use-case/create-my-dealership.use-case";
import { CreateMyDealershipHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/create-my-dealership/create-my-dealership.http-dto";

describe("CreateMyDealershipController", () => {
  let controller: CreateMyDealershipController;
  let createMyDealershipUseCase: Mock<CreateMyDealershipUseCase>;

  const profile_id = "profile-1";
  const dto: CreateMyDealershipHttpDto = {
    name: "My Dealership",
    slug: "my-dealership",
    avatar_url: "https://example.com/avatar.jpg",
    banner_url: "https://example.com/banner.jpg",
    description: "A great dealership",
    website_url: "https://example.com",
    email: "contact@dealership.com",
    phone_code: "+1",
    phone: "123456789",
    address: "123 Main St",
    lat: 40.7128,
    lng: -74.006,
  };
  const expectedResult = { id: "dealership-1" };

  beforeEach(() => {
    createMyDealershipUseCase = createMock<CreateMyDealershipUseCase>();
    controller = new CreateMyDealershipController(createMyDealershipUseCase);
  });

  it("should call use case with profile id and dto", () => {
    createMyDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(profile_id, dto);

    expect(createMyDealershipUseCase.execute).toHaveBeenCalledWith(
      profile_id,
      dto,
    );
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    createMyDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(profile_id, dto)).rejects.toThrow(error);
  });
});
