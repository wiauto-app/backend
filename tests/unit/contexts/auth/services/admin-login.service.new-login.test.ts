import { Request } from "express";

import { createMock, Mock } from "@/tests/utils/mock";
import { AdminLoginService } from "@/contexts/auth/services/admin-login.service";
import { AuthService } from "@/contexts/auth/services/auth.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { UserService } from "@/contexts/users/services/user.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { User } from "@/contexts/users/entities/user.entity";

describe("AdminLoginService.signIn (new_login)", () => {
  let service: AdminLoginService;
  let userService: Mock<UserService>;
  let passwordService: Mock<PasswordService>;
  let suspensionService: Mock<SuspensionService>;
  let authService: Mock<AuthService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;

  const request = {
    ip: "192.168.1.10",
    headers: { "user-agent": "AdminBrowser" },
  } as unknown as Request;

  beforeEach(() => {
    userService = createMock<UserService>();
    passwordService = createMock<PasswordService>();
    suspensionService = createMock<SuspensionService>();
    authService = createMock<AuthService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();

    service = new AdminLoginService(
      userService,
      passwordService,
      suspensionService,
      authService,
      authSecurityMailService,
    );

    passwordService.comparePassword.mockResolvedValue(true);
    authService.createSession.mockResolvedValue({
      session_id: "session-admin",
      refresh_token: "refresh",
      refresh_token_hash: "hash",
    });
    authService.createToken.mockReturnValue("token");
    userService.update.mockResolvedValue({ message: "ok", data: {} as User });
  });

  it("enqueues new_login with audience admin when type is session and previous last_sign_in exists", async () => {
    userService.findOneByEmailWithPassword.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      password: "hashed",
      is_email_verified: true,
      is_suspended: false,
      two_factor_enabled: false,
      last_sign_in: new Date("2026-02-01"),
      profile: { role: { is_admin: true, is_developer: false } },
    } as User);

    const result = await service.signIn({
      adminLoginDto: { email: "admin@example.com", password: "secret" },
      request,
    });

    expect(result.type).toBe("session");
    expect(authSecurityMailService.enqueueNewLogin).toHaveBeenCalledWith({
      to: "admin@example.com",
      ip_address: "192.168.1.10",
      user_agent: "AdminBrowser",
      audience: "admin",
    });
  });

  it("does not enqueue new_login on first admin session", async () => {
    userService.findOneByEmailWithPassword.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      password: "hashed",
      is_email_verified: true,
      is_suspended: false,
      two_factor_enabled: false,
      last_sign_in: null,
      profile: { role: { is_admin: true, is_developer: false } },
    } as User);

    await service.signIn({
      adminLoginDto: { email: "admin@example.com", password: "secret" },
      request,
    });

    expect(authSecurityMailService.enqueueNewLogin).not.toHaveBeenCalled();
  });
});
