import { createMock, Mock } from "@/tests/utils/mock";
import { AcceptDealershipInvitationController } from "@/contexts/dealership/infrastructure/http-api/invitations-v1/accept-dealership-invitation/accept-dealership-invitation.controller";
import { AcceptDealershipInvitationUseCase } from "@/contexts/dealership/application/dealership-invitation/accept-dealership-invitation-use-case/accept-dealership-invitation.use-case";

describe("AcceptDealershipInvitationController", () => {
  let controller: AcceptDealershipInvitationController;
  let acceptDealershipInvitationUseCase: Mock<AcceptDealershipInvitationUseCase>;

  beforeEach(() => {
    acceptDealershipInvitationUseCase = createMock<AcceptDealershipInvitationUseCase>();
    controller = new AcceptDealershipInvitationController(acceptDealershipInvitationUseCase);
  });

  it("should call use case with token and return json when with_response is true", async () => {
    const query = { token: "valid-token", with_response: true as any };
    const useCaseResult = { must_create: true, email: "user@example.com" };
    acceptDealershipInvitationUseCase.execute.mockResolvedValue(useCaseResult as any);
    const res = { redirect: vi.fn() } as any;

    const result = await controller.run(query, res);

    expect(acceptDealershipInvitationUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ token: "valid-token" }),
    );
    expect(result).toEqual({ must_create: true, email: "user@example.com" });
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it("should redirect to register when must_create is true and with_response is false", async () => {
    const query = { token: "valid-token" };
    const useCaseResult = { must_create: true, email: "user@example.com" };
    acceptDealershipInvitationUseCase.execute.mockResolvedValue(useCaseResult as any);
    const res = { redirect: vi.fn() } as any;

    await controller.run(query, res);

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      expect.stringContaining("/registro"),
    );
  });

  it("should redirect to team when must_create is false and with_response is false", async () => {
    const query = { token: "valid-token" };
    const useCaseResult = { must_create: false, email: "user@example.com" };
    acceptDealershipInvitationUseCase.execute.mockResolvedValue(useCaseResult as any);
    const res = { redirect: vi.fn() } as any;

    await controller.run(query, res);

    expect(res.redirect).toHaveBeenCalledWith(
      302,
      expect.stringContaining("/equipo"),
    );
  });

  it("should throw when use case throws", async () => {
    const error = new Error("Use case error");
    acceptDealershipInvitationUseCase.execute.mockRejectedValue(error);
    const res = { redirect: vi.fn() } as any;

    await expect(controller.run({ token: "invalid" }, res)).rejects.toThrow(error);
  });
});
