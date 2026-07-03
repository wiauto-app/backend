import { createMock, Mock } from "@/tests/utils/mock";
import { AuthController } from "@/contexts/auth/api/auth.controller";
import { AuthService } from "@/contexts/auth/services/auth.service";
import { GoogleTokenService } from "@/contexts/auth/services/google-token.service";
import { AdminLoginService } from "@/contexts/auth/services/admin-login.service";
import { TwoFactorLoginService } from "@/contexts/auth/services/two-factor-login.service";
import { PasswordRecoveryService } from "@/contexts/auth/services/password-recovery.service";
import { AppleTokenService } from "@/contexts/auth/services/apple-token.service";
import { RegisterService } from "@/contexts/auth/services/register.service";

describe("AuthController", () => {
  let authController: AuthController;
  let authService: Mock<AuthService>;
  let googleTokenService: Mock<GoogleTokenService>;
  let adminLoginService: Mock<AdminLoginService>;
  let twoFactorLoginService: Mock<TwoFactorLoginService>;
  let passwordRecoveryService: Mock<PasswordRecoveryService>;
  let appleTokenService: Mock<AppleTokenService>;
  let registerService: Mock<RegisterService>;

  beforeEach(() => {
    authService = createMock<AuthService>();
    googleTokenService = createMock<GoogleTokenService>();
    adminLoginService = createMock<AdminLoginService>();
    twoFactorLoginService = createMock<TwoFactorLoginService>();
    passwordRecoveryService = createMock<PasswordRecoveryService>();
    appleTokenService = createMock<AppleTokenService>();
    registerService = createMock<RegisterService>();

    authController = new AuthController(
      authService,
      googleTokenService,
      adminLoginService,
      twoFactorLoginService,
      passwordRecoveryService,
      appleTokenService,
      registerService,
    );
  });

  describe("adminLogin", () => {
    it("should return 2fa_required when 2fa challenge is needed", async () => {
      const dto = { email: "admin@test.com", password: "admin123" } as any;
      const req = {} as any;
      const res = { cookie: vi.fn() } as any;
      adminLoginService.signIn.mockResolvedValue({
        type: "2fa_challenge",
        token: "2fa-jwt",
        refresh_token: "refresh-token",
      });

      const result = await authController.adminLogin(dto, req, res);

      expect(result.data.type).toBe("2fa_required");
      expect(res.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe("getAdminTwoFactorChallenge", () => {
    it("should return challenge status", async () => {
      const payload = { email: "admin@test.com" } as any;
      twoFactorLoginService.getChallengeStatus.mockReturnValue({
        email: "admin@test.com",
        type: "2fa_required",
      });

      const result = await authController.getAdminTwoFactorChallenge(payload);

      expect(twoFactorLoginService.getChallengeStatus).toHaveBeenCalledWith(
        "admin@test.com",
      );
      expect(result.type).toBe("2fa_required");
    });
  });

  describe("verifyAdminTwoFactorLogin", () => {
    it("should verify totp and set cookie", async () => {
      const payload = { id: "user-1", session_id: "session-1", refreshToken_hash: "hash" } as any;
      const dto = { token: "123456" } as any;
      const res = { cookie: vi.fn() } as any;
      twoFactorLoginService.verifyTotpChallenge.mockResolvedValue({
        type: "session",
        token: "session-jwt",
      });

      const result = await authController.verifyAdminTwoFactorLogin(payload, dto, res);

      expect(twoFactorLoginService.verifyTotpChallenge).toHaveBeenCalledWith(
        "user-1",
        dto,
        payload,
      );
      expect(res.cookie).toHaveBeenCalledTimes(1);
      expect(result.data.type).toBe("session");
    });
  });

  describe("verifyAdminBackupCodeLogin", () => {
    it("should verify backup code and set cookie", async () => {
      const payload = { id: "user-1", session_id: "session-1", refreshToken_hash: "hash" } as any;
      const dto = { code: "abc-def" } as any;
      const res = { cookie: vi.fn() } as any;
      twoFactorLoginService.verifyBackupCodeChallenge.mockResolvedValue({
        type: "session",
        token: "session-jwt",
      });

      const result = await authController.verifyAdminBackupCodeLogin(payload, dto, res);

      expect(twoFactorLoginService.verifyBackupCodeChallenge).toHaveBeenCalledWith(
        "user-1",
        "ABC-DEF",
        payload,
      );
      expect(res.cookie).toHaveBeenCalledTimes(1);
      expect(result.data.type).toBe("session");
    });
  });

  describe("getTwoFactorChallenge", () => {
    it("should return challenge status", async () => {
      const payload = { email: "user@test.com" } as any;
      twoFactorLoginService.getChallengeStatus.mockReturnValue({
        email: "user@test.com",
        type: "2fa_required",
      });

      const result = await authController.getTwoFactorChallenge(payload);

      expect(twoFactorLoginService.getChallengeStatus).toHaveBeenCalledWith(
        "user@test.com",
      );
    });
  });

  describe("verifyTwoFactorLogin", () => {
    it("should verify totp and set cookie", async () => {
      const payload = { id: "user-1", session_id: "session-1", refreshToken_hash: "hash" } as any;
      const dto = { token: "123456" } as any;
      const res = { cookie: vi.fn() } as any;
      twoFactorLoginService.verifyTotpChallenge.mockResolvedValue({
        type: "session",
        token: "session-jwt",
      });

      const result = await authController.verifyTwoFactorLogin(payload, dto, res);

      expect(twoFactorLoginService.verifyTotpChallenge).toHaveBeenCalledWith(
        "user-1",
        dto,
        payload,
      );
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe("verifyBackupCodeLogin", () => {
    it("should verify backup code and set cookie", async () => {
      const payload = { id: "user-1", session_id: "session-1", refreshToken_hash: "hash" } as any;
      const dto = { code: "xyz-789" } as any;
      const res = { cookie: vi.fn() } as any;
      twoFactorLoginService.verifyBackupCodeChallenge.mockResolvedValue({
        type: "session",
        token: "session-jwt",
      });

      const result = await authController.verifyBackupCodeLogin(payload, dto, res);

      expect(twoFactorLoginService.verifyBackupCodeChallenge).toHaveBeenCalledWith(
        "user-1",
        "XYZ-789",
        payload,
      );
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });
  });

  describe("adminRefreshToken", () => {
    it("should refresh token and set cookies", async () => {
      const res = { cookie: vi.fn() } as any;
      authService.refreshToken.mockResolvedValue({
        type: "session",
        token: "new-jwt",
        refresh_token: "new-rt",
      });

      const result = await authController.adminRefreshToken("refresh-token", res);

      expect(authService.refreshToken).toHaveBeenCalledWith("refresh-token");
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(result.token).toBe("new-jwt");
    });
  });

  describe("googleMobile", () => {
    it("should verify id token and sign in with OAuth", async () => {
      const dto = { id_token: "google-id-token" } as any;
      const req = {} as any;
      const profile = { provider: "google", email: "oauth@test.com" } as any;
      googleTokenService.verifyIdToken.mockResolvedValue(profile);
      authService.signInWithOAuthProfile.mockResolvedValue({
        type: "session",
        token: "oauth-jwt",
        refresh_token: "oauth-rt",
      } as any);

      const result = await authController.googleMobile(dto, req);

      expect(googleTokenService.verifyIdToken).toHaveBeenCalledWith("google-id-token");
      expect(authService.signInWithOAuthProfile).toHaveBeenCalledWith(profile, req);
      expect(result.token).toBeDefined();
    });
  });

  describe("appleCallback", () => {
    it("should sign in with Apple OAuth profile and redirect", async () => {
      const req = { user: { provider: "apple", email: "apple@test.com" } } as any;
      const res = { redirect: vi.fn() } as any;
      authService.signInWithOAuthProfile.mockResolvedValue({
        type: "session",
        token: "apple-jwt",
        refresh_token: "apple-rt",
      });

      await authController.appleCallback(req, res);

      expect(authService.signInWithOAuthProfile).toHaveBeenCalledWith(req.user, req);
      expect(res.redirect).toHaveBeenCalled();
    });
  });

  describe("register", () => {
    it("should call registerService.register", async () => {
      const dto = { email: "test@test.com", password: "pass123", name: "Test" } as any;
      registerService.register.mockResolvedValue({ message: "ok", data: { id: "1" } } as any);

      const result = await authController.register(dto);

      expect(registerService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ message: "ok", data: { id: "1" } });
    });
  });

  describe("login", () => {
    it("should call authService.signIn", async () => {
      const dto = { email: "test@test.com", password: "pass123" } as any;
      const req = { ip: "127.0.0.1" } as any;
      authService.signIn.mockResolvedValue({ type: "session", token: "jwt", refresh_token: "rt" } as any);

      const result = await authController.login(dto, req);

      expect(authService.signIn).toHaveBeenCalledWith({ loginDto: dto, request: req });
      expect(result).toEqual({ type: "session", token: "jwt", refresh_token: "rt" });
    });
  });

  describe("adminLogout", () => {
    it("should logout and clear cookies", async () => {
      const res = { clearCookie: vi.fn() } as any;
      adminLoginService.logout.mockResolvedValue(undefined);

      await authController.adminLogout(res, "session-1");

      expect(adminLoginService.logout).toHaveBeenCalledWith("session-1");
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
    });
  });

  describe("refreshToken", () => {
    it("should call authService.refreshToken", async () => {
      authService.refreshToken.mockResolvedValue({ type: "session", token: "new-jwt", refresh_token: "new-rt" } as any);

      const result = await authController.refreshToken("refresh-token");

      expect(authService.refreshToken).toHaveBeenCalledWith("refresh-token");
      expect(result).toEqual({ type: "session", token: "new-jwt", refresh_token: "new-rt" });
    });
  });

  describe("logout", () => {
    it("should call authService.logout", async () => {
      authService.logout.mockResolvedValue(undefined);

      await authController.logout("session-1");

      expect(authService.logout).toHaveBeenCalledWith("session-1");
    });
  });

  describe("adminPasswordRecoveryRequest", () => {
    it("should call password_recovery_service.requestAdminRecovery", async () => {
      passwordRecoveryService.requestAdminRecovery.mockResolvedValue(undefined);

      const result = await authController.adminPasswordRecoveryRequest({ email: "admin@test.com" } as any);

      expect(passwordRecoveryService.requestAdminRecovery).toHaveBeenCalledWith("admin@test.com");
      expect(result.message).toBeDefined();
    });
  });

  describe("adminPasswordRecoveryChange", () => {
    it("should call password_recovery_service.changeAdminPassword", async () => {
      passwordRecoveryService.changeAdminPassword.mockResolvedValue(undefined);

      const result = await authController.adminPasswordRecoveryChange({
        token: "reset-token",
        password: "new-password",
      } as any);

      expect(passwordRecoveryService.changeAdminPassword).toHaveBeenCalledWith("reset-token", "new-password");
      expect(result.message).toBeDefined();
    });
  });
});
