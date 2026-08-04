import { createMock, Mock } from "@/tests/utils/mock";
import { TwoFactorLoginService } from "@/contexts/auth/services/two-factor-login.service";
import { AuthService } from "@/contexts/auth/services/auth.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { SessionService } from "@/contexts/auth/services/session.service";
import { TwoFactorAuthService } from "@/contexts/2fa/services/2fa.service";
import { UserService } from "@/contexts/users/services/user.service";
import { SessionPayload } from "@/contexts/auth/types/auth.types";
import { User } from "@/contexts/users/entities/user.entity";

describe("TwoFactorLoginService (new_login after verify)", () => {
  let service: TwoFactorLoginService;
  let authService: Mock<AuthService>;
  let twoFactorAuthService: Mock<TwoFactorAuthService>;
  let userService: Mock<UserService>;
  let sessionService: Mock<SessionService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;

  const basePayload: SessionPayload = {
    id: "user-1",
    email: "user@example.com",
    session_id: "session-1",
    refreshToken_hash: "hash",
    scope: "2fa_challenge",
  };

  beforeEach(() => {
    authService = createMock<AuthService>();
    twoFactorAuthService = createMock<TwoFactorAuthService>();
    userService = createMock<UserService>();
    sessionService = createMock<SessionService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();

    service = new TwoFactorLoginService(
      authService,
      twoFactorAuthService,
      userService,
      sessionService,
      authSecurityMailService,
    );

    authService.createVerifiedSessionToken.mockReturnValue("session-token");
    sessionService.findOne.mockResolvedValue({
      id: "session-1",
      ip_address: "8.8.8.8",
      user_agent: "Chrome",
    } as any);
  });

  it("enqueues new_login after TOTP verify when notify_new_login is true", async () => {
    userService.findOne.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      profile: { role: { is_admin: false, is_developer: false } },
    } as User);

    await service.verifyTotpChallenge(
      "user-1",
      { code: "123456" } as any,
      { ...basePayload, notify_new_login: true },
    );

    expect(authSecurityMailService.enqueueNewLogin).toHaveBeenCalledWith({
      to: "user@example.com",
      ip_address: "8.8.8.8",
      user_agent: "Chrome",
      audience: "platform",
    });
  });

  it("does not enqueue new_login after verify when notify_new_login is false", async () => {
    userService.findOne.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      profile: { role: { is_admin: false } },
    } as User);

    await service.verifyBackupCodeChallenge(
      "user-1",
      "ABCD",
      { ...basePayload, notify_new_login: false },
    );

    expect(authSecurityMailService.enqueueNewLogin).not.toHaveBeenCalled();
  });

  it("uses audience admin when verified user has admin role", async () => {
    userService.findOne.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      profile: { role: { is_admin: true, is_developer: false } },
    } as User);

    await service.verifyTotpChallenge(
      "admin-1",
      { code: "123456" } as any,
      {
        ...basePayload,
        id: "admin-1",
        email: "admin@example.com",
        notify_new_login: true,
      },
    );

    expect(authSecurityMailService.enqueueNewLogin).toHaveBeenCalledWith(
      expect.objectContaining({ audience: "admin" }),
    );
  });
});
