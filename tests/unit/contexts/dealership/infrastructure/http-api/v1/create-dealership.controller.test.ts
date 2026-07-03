import { createMock, Mock } from "@/tests/utils/mock";
import { CreateDealershipController } from "@/contexts/dealership/infrastructure/http-api/v1/create-dealership/create-dealership.controller";
import { CreateDealershipUseCase } from "@/contexts/dealership/application/dealership/create-dealership-use-case/create-dealership.use-case";
import { CreateDealershipHttpDto } from "@/contexts/dealership/infrastructure/http-api/v1/create-dealership/create-dealership.http-dto";

describe("CreateDealershipController", () => {
  let controller: CreateDealershipController;
  let createDealershipUseCase: Mock<CreateDealershipUseCase>;

  const dto: CreateDealershipHttpDto = {
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
    show_phone: true,
    members: [{ profile_id: "profile-1", role: "owner" }],
  };
  const expectedResult = { id: "dealership-1" };

  beforeEach(() => {
    createDealershipUseCase = createMock<CreateDealershipUseCase>();
    controller = new CreateDealershipController(createDealershipUseCase);
  });

  it("should call use case with dto with mapped members", () => {
    createDealershipUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto);

    expect(createDealershipUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        name: dto.name,
        slug: dto.slug,
        email: dto.email,
        members: [{ profile_id: "profile-1", role: "owner" }],
      }),
    );
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    createDealershipUseCase.execute.mockRejectedValue(error);

    expect(controller.run(dto)).rejects.toThrow(error);
  });
});
