import { createMock, Mock } from "@/tests/utils/mock";
import { RevokeDealershipInvitationController } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/revoke-dealership-invitation/revoke-dealership-invitation.controller";
import { RevokeDealershipInvitationUseCase } from "@/contexts/dealership/application/dealership-invitation/revoke-dealership-invitation-use-case/revoke-dealership-invitation.use-case";
import { RevokeDealershipInvitationHttpDto } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/revoke-dealership-invitation/revoke-dealership-invitation.http-dto";

describe("RevokeDealershipInvitationController", () => {
  let controller: RevokeDealershipInvitationController;
  let revokeDealershipInvitationUseCase: Mock<RevokeDealershipInvitationUseCase>;

  const params: RevokeDealershipInvitationHttpDto = { id: "invitation-1" };

  beforeEach(() => {
    revokeDealershipInvitationUseCase = createMock<RevokeDealershipInvitationUseCase>();
    controller = new RevokeDealershipInvitationController(revokeDealershipInvitationUseCase);
  });

  it("should call use case with id", async () => {
    revokeDealershipInvitationUseCase.execute.mockResolvedValue(undefined);

    const result = await controller.run(params);

    expect(revokeDealershipInvitationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: params.id }),
    );
    expect(result).toBe(undefined);
  });

  it("should throw when use case throws", () => {
    const error = new Error("Use case error");
    revokeDealershipInvitationUseCase.execute.mockRejectedValue(error);

    expect(controller.run(params)).rejects.toThrow(error);
  });
});
