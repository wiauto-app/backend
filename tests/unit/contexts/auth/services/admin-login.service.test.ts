import { UnauthorizedException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminLoginService } from "@/contexts/auth/services/admin-login.service";
import { UserService } from "@/contexts/users/services/user.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { AuthService } from "@/contexts/auth/services/auth.service";

describe("AdminLoginService", () => {
  let adminLoginService: AdminLoginService;
  let userService: Mock<UserService>;
  let passwordService: Mock<PasswordService>;
  let suspensionService: Mock<SuspensionService>;
  let authService: Mock<AuthService>;

  const adminUser = {
    id: "admin-1",
    email: "admin@example.com",
    password: "hashed-password",
    provider: "local",
    is_email_verified: true,
    is_suspended: false,
    two_factor_enabled: false,
    profile: {
      role: { is_admin: true, is_developer: false },
    },
  } as any;

  const loginDto = { email: "admin@example.com", password: "admin123" };
  const request = {} as any;

  beforeEach(() => {
    userService = createMock<UserService>();
    passwordService = createMock<PasswordService>();
    suspensionService = createMock<SuspensionService>();
    authService = createMock<AuthService>();

    adminLoginService = new AdminLoginService(
      userService,
      passwordService,
      suspensionService,
      authService,
    );
  });

  describe("signIn", () => {
    it("should sign in admin successfully", async () => {
      userService.findOneByEmailWithPassword.mockResolvedValue(adminUser);
      passwordService.comparePassword.mockResolvedValue(true);
      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);
      authService.createSession.mockResolvedValue({
        session_id: "session-1",
        refresh_token: "refresh-token",
        refresh_token_hash: "hash-1",
      });
      userService.update.mockResolvedValue(undefined as any);
      authService.createToken.mockReturnValue("admin-jwt");

      const result = await adminLoginService.signIn({ adminLoginDto: loginDto, request });

      expect(result).toEqual({
        type: "session",
        token: "admin-jwt",
        refresh_token: "refresh-token",
      });
    });

    it("should throw if user has no password (different provider)", async () => {
      const googleUser = { ...adminUser, password: null };
      userService.findOneByEmailWithPassword.mockResolvedValue(googleUser);

      await expect(
        adminLoginService.signIn({ adminLoginDto: loginDto, request }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if password is invalid", async () => {
      userService.findOneByEmailWithPassword.mockResolvedValue(adminUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(
        adminLoginService.signIn({ adminLoginDto: loginDto, request }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if email is not verified", async () => {
      const unverifiedUser = { ...adminUser, is_email_verified: false };
      userService.findOneByEmailWithPassword.mockResolvedValue(unverifiedUser);
      passwordService.comparePassword.mockResolvedValue(true);

      await expect(
        adminLoginService.signIn({ adminLoginDto: loginDto, request }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user is suspended", async () => {
      const suspendedUser = { ...adminUser, is_suspended: true };
      userService.findOneByEmailWithPassword.mockResolvedValue(suspendedUser);
      passwordService.comparePassword.mockResolvedValue(true);

      await expect(
        adminLoginService.signIn({ adminLoginDto: loginDto, request }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user is not admin or developer", async () => {
      const nonAdminUser = {
        ...adminUser,
        profile: { role: { is_admin: false, is_developer: false } },
      };
      userService.findOneByEmailWithPassword.mockResolvedValue(nonAdminUser);
      passwordService.comparePassword.mockResolvedValue(true);

      await expect(
        adminLoginService.signIn({ adminLoginDto: loginDto, request }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("logout", () => {
    it("should call authService.logout", async () => {
      authService.logout.mockResolvedValue(undefined);

      await adminLoginService.logout("session-1");

      expect(authService.logout).toHaveBeenCalledWith("session-1");
    });
  });
});
