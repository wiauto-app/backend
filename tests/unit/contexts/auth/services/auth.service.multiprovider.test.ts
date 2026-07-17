import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { DataSource } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { AuthService } from "@/contexts/auth/services/auth.service";
import { UserService } from "@/contexts/users/services/user.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { PasswordService } from "@/contexts/auth/services/password.service";
import { SessionService } from "@/contexts/auth/services/session.service";
import { RefreshTokenService } from "@/contexts/auth/services/refresh-token.service";
import { AuthSessionService } from "@/contexts/auth/services/auth-session.service";
import { RolesService } from "@/contexts/roles/services/roles.service";
import { authResponseConfig } from "@/contexts/auth/response.config";

describe("AuthService.signIn (multiprovider)", () => {
  let authService: AuthService;
  let userService: Mock<UserService>;
  let suspensionService: Mock<SuspensionService>;
  let passwordService: Mock<PasswordService>;
  let jwtService: Mock<JwtService>;
  let sessionService: Mock<SessionService>;
  let refreshTokenService: Mock<RefreshTokenService>;
  let authSessionService: Mock<AuthSessionService>;
  let roleService: Mock<RolesService>;
  let dataSource: Mock<DataSource>;

  const loginDto = { email: "user@example.com", password: "password123" };
  const request = {
    ip: "127.0.0.1",
    headers: { "user-agent": "test" },
  } as any;

  beforeEach(() => {
    userService = createMock<UserService>();
    suspensionService = createMock<SuspensionService>();
    passwordService = createMock<PasswordService>();
    jwtService = createMock<JwtService>();
    sessionService = createMock<SessionService>();
    refreshTokenService = createMock<RefreshTokenService>();
    authSessionService = createMock<AuthSessionService>();
    roleService = createMock<RolesService>();
    dataSource = createMock<DataSource>();

    authService = new AuthService(
      userService,
      suspensionService,
      passwordService,
      jwtService,
      sessionService,
      refreshTokenService,
      authSessionService,
      roleService,
      dataSource,
    );
  });

  it("allows local login after Google was linked to the same account", async () => {
    const userWithPasswordAndGoogle = {
      id: "user-1",
      email: loginDto.email,
      password: "hashed-local-password",
      is_email_verified: true,
      two_factor_enabled: false,
      auth_providers: [
        {
          id: "identity-google",
          provider: "google",
          provider_id: "google-123",
        },
      ],
    };

    userService.findOneByEmailWithPassword.mockResolvedValue(
      userWithPasswordAndGoogle as any,
    );
    passwordService.comparePassword.mockResolvedValue(true);
    authSessionService.establishSessionForUser.mockResolvedValue({
      type: "session",
      token: "jwt-token",
      refresh_token: "refresh-token",
    });

    const result = await authService.signIn({ loginDto, request });

    expect(result).toEqual({
      type: "session",
      token: "jwt-token",
      refresh_token: "refresh-token",
    });
    expect(passwordService.comparePassword).toHaveBeenCalledWith(
      loginDto.password,
      "hashed-local-password",
    );
    expect(authSessionService.establishSessionForUser).toHaveBeenCalledWith(
      userWithPasswordAndGoogle,
      request,
    );
  });

  it("rejects local login when the account has no password (OAuth-only)", async () => {
    userService.findOneByEmailWithPassword.mockResolvedValue({
      id: "user-2",
      email: loginDto.email,
      password: null,
      is_email_verified: true,
      auth_providers: [
        {
          id: "identity-google",
          provider: "google",
          provider_id: "google-999",
        },
      ],
    } as any);

    await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
      authResponseConfig.messages.DIFFERENT_PROVIDER,
    );
    expect(passwordService.comparePassword).not.toHaveBeenCalled();
  });
});
