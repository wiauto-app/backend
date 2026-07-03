import { createMock, Mock } from "@/tests/utils/mock";
import { CreateDealershipInvitationController } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.controller";
import { CreateDealershipInvitationUseCase } from "@/contexts/dealership/application/dealership-invitation/create-dealership-invitation-use-case/create-dealership-invitation.use-case";
import { CreateDealershipInvitationHttpDto } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/create-dealership-invitation/create-dealership-invitation.http-dto";

describe("CreateDealershipInvitationController", () => {
  let controller: CreateDealershipInvitationController;
  let createDealershipInvitationUseCase: Mock<CreateDealershipInvitationUseCase>;

  const invited_by_id = "profile-1";
  const dto: CreateDealershipInvitationHttpDto = {
    email: "user@example.com",
    role: "admin",
    dealership_id: "dealership-1",
  };
  const expectedResult = { id: "invitation-1" };

  beforeEach(() => {
    createDealershipInvitationUseCase = createMock<CreateDealershipInvitationUseCase>();
    controller = new CreateDealershipInvitationController(createDealershipInvitationUseCase);
  });

  it("should call use case with dto and invited_by_id", () => {
    createDealershipInvitationUseCase.execute.mockReturnValue(expectedResult as any);

    const result = controller.run(dto, invited_by_id);

    expect(createDealershipInvitationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        email: dto.email,
        role: dto.role,
        dealership_id: dto.dealership_id,
        invited_by_id,
      }),
    );
    expect(result).toBe(expectedResult);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    createDealershipInvitationUseCase.execute.mockRejectedValue(error);

    expect(controller.run(dto, invited_by_id)).rejects.toThrow(error);
  });
});
