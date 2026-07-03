import { createMock, Mock } from "@/tests/utils/mock";
import { RejectDealershipInvitationController } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/reject-dealership-invitation/reject-dealership-invitation.controller";
import { RejectDealershipInvitationUseCase } from "@/contexts/dealership/application/dealership-invitation/reject-dealership-invitation-use-case/reject-dealership-invitation.use-case";

describe("RejectDealershipInvitationController", () => {
  let controller: RejectDealershipInvitationController;
  let rejectDealershipInvitationUseCase: Mock<RejectDealershipInvitationUseCase>;

  beforeEach(() => {
    rejectDealershipInvitationUseCase = createMock<RejectDealershipInvitationUseCase>();
    controller = new RejectDealershipInvitationController(rejectDealershipInvitationUseCase);
  });

  it("should call use case with token and return json when with_response is true", async () => {
    const query = { token: "valid-token", with_response: true as any };
    rejectDealershipInvitationUseCase.execute.mockResolvedValue({ email: "user@example.com" } as any);
    const res = { redirect: vi.fn() } as any;

    const result = await controller.run(query, res);

    expect(rejectDealershipInvitationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ token: "valid-token" }),
    );
    expect(result).toEqual({ email: "user@example.com", rejected: true });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("should redirect to invitation-rejected when with_response is false", async () => {
    const query = { token: "valid-token" };
    rejectDealershipInvitationUseCase.execute.mockResolvedValue({ email: "user@example.com" } as any);
    const res = { redirect: vi.fn() } as any;

    await controller.run(query, res);

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      expect.stringContaining("/invitacion/rechazada"),
    );
  });

  it("should throw when use case throws", async () => {
    const error = new Error("Use case error");
    rejectDealershipInvitationUseCase.execute.mockRejectedValue(error);
    const res = { redirect: vi.fn() } as any;

    await expect(controller.run({ token: "invalid" }, res)).rejects.toThrow(error);
  });
});
