import { createMock, Mock } from "@/tests/utils/mock";
import { TwoFactorLoginService } from "@/contexts/auth/services/two-factor-login.service";
import { AuthService } from "@/contexts/auth/services/auth.service";
import { TwoFactorAuthService } from "@/contexts/2fa/services/2fa.service";
import { UserService } from "@/contexts/users/services/user.service";

describe("TwoFactorLoginService", () => {
  let twoFactorLoginService: TwoFactorLoginService;
  let authService: Mock<AuthService>;
  let twoFactorAuthService: Mock<TwoFactorAuthService>;
  let userService: Mock<UserService>;

  const sessionPayload = {
    id: "user-1",
    email: "test@example.com",
    session_id: "session-1",
    refreshToken_hash: "hash-1",
    scope: "2fa_challenge",
  } as any;

  beforeEach(() => {
    authService = createMock<AuthService>();
    twoFactorAuthService = createMock<TwoFactorAuthService>();
    userService = createMock<UserService>();
    twoFactorLoginService = new TwoFactorLoginService(
      authService,
      twoFactorAuthService,
      userService,
    );
  });

  describe("verifyTotpChallenge", () => {
    it("should verify TOTP and return session token", async () => {
      twoFactorAuthService.verify.mockResolvedValue(undefined);
      userService.findOne.mockResolvedValue({ id: "user-1" } as any);
      authService.createVerifiedSessionToken.mockReturnValue("verified-jwt");

      const result = await twoFactorLoginService.verifyTotpChallenge(
        "user-1",
        { code: "123456" } as any,
        sessionPayload,
      );

      expect(result).toEqual({ type: "session", token: "verified-jwt" });
      expect(twoFactorAuthService.verify).toHaveBeenCalledWith("user-1", {
        code: "123456",
      });
      expect(authService.createVerifiedSessionToken).toHaveBeenCalledWith({
        user: { id: "user-1" },
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });
    });
  });

  describe("verifyBackupCodeChallenge", () => {
    it("should verify backup code and return session token", async () => {
      twoFactorAuthService.consumeBackupCode.mockResolvedValue(undefined);
      userService.findOne.mockResolvedValue({ id: "user-1" } as any);
      authService.createVerifiedSessionToken.mockReturnValue("verified-jwt");

      const result = await twoFactorLoginService.verifyBackupCodeChallenge(
        "user-1",
        "BACKUP-CODE",
        sessionPayload,
      );

      expect(result).toEqual({ type: "session", token: "verified-jwt" });
      expect(twoFactorAuthService.consumeBackupCode).toHaveBeenCalledWith(
        "user-1",
        "BACKUP-CODE",
      );
    });
  });

  describe("getChallengeStatus", () => {
    it("should return challenge status", () => {
      const result = twoFactorLoginService.getChallengeStatus("test@example.com");

      expect(result).toEqual({
        email: "test@example.com",
        type: "2fa_required",
      });
    });
  });
});
