import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { createMock, Mock } from "@/tests/utils/mock";
import { PasswordRecoveryService, } from "@/contexts/auth/services/password-recovery.service";
import { UserService } from "@/contexts/users/services/user.service";
import { OutboundMailEnqueueService } from "@/contexts/shared/mail/outbound-mail-enqueue.service";

const mockRole = (overrides = {}) => ({
  is_admin: false,
  is_developer: false,
  ...overrides,
});

describe("PasswordRecoveryService", () => {
  let passwordRecoveryService: PasswordRecoveryService;
  let userService: Mock<UserService>;
  let jwtService: Mock<JwtService>;
  let outboundMailEnqueueService: Mock<OutboundMailEnqueueService>;

  beforeEach(() => {
    userService = createMock<UserService>();
    jwtService = createMock<JwtService>();
    outboundMailEnqueueService = createMock<OutboundMailEnqueueService>();
    passwordRecoveryService = new PasswordRecoveryService(
      userService,
      jwtService,
      outboundMailEnqueueService,
    );
  });

  describe("requestRecovery", () => {
    const email = "test@example.com";

    it("should send recovery email for local user", async () => {
      userService.getUserByEmail.mockResolvedValue({
        id: "user-1",
        email,
        provider: "local",
      } as any);
      jwtService.sign.mockReturnValue("reset-token");
      outboundMailEnqueueService.enqueue_password_recovery.mockResolvedValue(undefined);

      await passwordRecoveryService.requestRecovery(email);

      expect(jwtService.sign).toHaveBeenCalled();
      expect(outboundMailEnqueueService.enqueue_password_recovery).toHaveBeenCalledWith(
        expect.objectContaining({ to: email }),
      );
    });

    it("should silently return for unknown email", async () => {
      userService.getUserByEmail.mockRejectedValue(new NotFoundException());

      await passwordRecoveryService.requestRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).not.toHaveBeenCalled();
    });

    it("should silently return for non-local provider", async () => {
      userService.getUserByEmail.mockResolvedValue({
        id: "user-1",
        email,
        provider: "google",
      } as any);

      await passwordRecoveryService.requestRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).not.toHaveBeenCalled();
    });
  });

  describe("changePassword", () => {
    it("should change password with valid token", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        scope: "password_reset",
      });
      userService.resetPassword.mockResolvedValue(undefined as any);

      await passwordRecoveryService.changePassword("valid-token", "new-password");

      expect(userService.resetPassword).toHaveBeenCalledWith("user-1", "new-password");
    });

    it("should throw if scope is wrong", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        scope: "password_reset_admin",
      });

      await expect(
        passwordRecoveryService.changePassword("token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if token is invalid", async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("invalid");
      });

      await expect(
        passwordRecoveryService.changePassword("bad-token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("requestAdminRecovery", () => {
    const email = "admin@example.com";
    const mockUser = (overrides = {}) => ({
      id: "admin-1",
      email,
      provider: "local",
      profile: {
        role: mockRole({ is_admin: true }),
      },
      ...overrides,
    });

    it("should send recovery email for admin user", async () => {
      const user = mockUser();
      userService.findOneByEmailWithPassword.mockResolvedValue(user as any);
      jwtService.sign.mockReturnValue("admin-reset-token");
      outboundMailEnqueueService.enqueue_password_recovery.mockResolvedValue(undefined);

      await passwordRecoveryService.requestAdminRecovery(email);

      expect(userService.findOneByEmailWithPassword).toHaveBeenCalledWith(email);
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "password_reset_admin" }),
        expect.any(Object),
      );
      expect(outboundMailEnqueueService.enqueue_password_recovery).toHaveBeenCalledWith(
        expect.objectContaining({ to: email }),
      );
    });

    it("should send recovery email for developer user", async () => {
      const user = mockUser({ profile: { role: mockRole({ is_developer: true }) } });
      userService.findOneByEmailWithPassword.mockResolvedValue(user as any);
      jwtService.sign.mockReturnValue("admin-reset-token");
      outboundMailEnqueueService.enqueue_password_recovery.mockResolvedValue(undefined);

      await passwordRecoveryService.requestAdminRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).toHaveBeenCalled();
    });

    it("should silently return for unknown email", async () => {
      userService.findOneByEmailWithPassword.mockRejectedValue(new NotFoundException());

      await passwordRecoveryService.requestAdminRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).not.toHaveBeenCalled();
    });

    it("should silently return for non-local provider", async () => {
      const user = mockUser({ provider: "google" });
      userService.findOneByEmailWithPassword.mockResolvedValue(user as any);

      await passwordRecoveryService.requestAdminRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).not.toHaveBeenCalled();
    });

    it("should silently return for non-admin role", async () => {
      const user = mockUser({ profile: { role: mockRole() } });
      userService.findOneByEmailWithPassword.mockResolvedValue(user as any);

      await passwordRecoveryService.requestAdminRecovery(email);

      expect(outboundMailEnqueueService.enqueue_password_recovery).not.toHaveBeenCalled();
    });

    it("should re-throw non-NotFoundException errors", async () => {
      userService.findOneByEmailWithPassword.mockRejectedValue(new Error("DB error"));

      await expect(
        passwordRecoveryService.requestAdminRecovery(email),
      ).rejects.toThrow("DB error");
    });
  });

  describe("changeAdminPassword", () => {
    it("should change admin password with valid token", async () => {
      const user = {
        id: "admin-1",
        provider: "local",
        profile: { role: mockRole({ is_admin: true }) },
      };
      jwtService.verify.mockReturnValue({
        sub: "admin-1",
        scope: "password_reset_admin",
      });
      userService.findOne.mockResolvedValue(user as any);
      userService.resetPassword.mockResolvedValue(undefined as any);

      await passwordRecoveryService.changeAdminPassword("valid-token", "new-password");

      expect(userService.resetPassword).toHaveBeenCalledWith("admin-1", "new-password");
    });

    it("should throw if scope is wrong", async () => {
      jwtService.verify.mockReturnValue({
        sub: "admin-1",
        scope: "password_reset",
      });

      await expect(
        passwordRecoveryService.changeAdminPassword("token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user provider is not local", async () => {
      const user = {
        id: "admin-1",
        provider: "google",
        profile: { role: mockRole({ is_admin: true }) },
      };
      jwtService.verify.mockReturnValue({
        sub: "admin-1",
        scope: "password_reset_admin",
      });
      userService.findOne.mockResolvedValue(user as any);

      await expect(
        passwordRecoveryService.changeAdminPassword("token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user has no role", async () => {
      const user = {
        id: "admin-1",
        provider: "local",
        profile: { role: null },
      };
      jwtService.verify.mockReturnValue({
        sub: "admin-1",
        scope: "password_reset_admin",
      });
      userService.findOne.mockResolvedValue(user as any);

      await expect(
        passwordRecoveryService.changeAdminPassword("token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user is not admin or developer", async () => {
      const user = {
        id: "admin-1",
        provider: "local",
        profile: { role: mockRole() },
      };
      jwtService.verify.mockReturnValue({
        sub: "admin-1",
        scope: "password_reset_admin",
      });
      userService.findOne.mockResolvedValue(user as any);

      await expect(
        passwordRecoveryService.changeAdminPassword("token", "new-pass"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
