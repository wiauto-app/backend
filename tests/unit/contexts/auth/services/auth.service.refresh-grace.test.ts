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
import { hashToken } from "@/contexts/shared/token_management/hash_token";

describe("AuthService.refreshToken (rotation grace)", () => {
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

  const parent_raw = "parent-refresh-raw";
  const parent_hash = hashToken(parent_raw);
  const child_raw = "child-refresh-raw";
  const child_hash = hashToken(child_raw);

  const user = {
    id: "user-1",
    email: "user@example.com",
    two_factor_enabled: false,
  };

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

  it("returns child tokens when revoked parent is reused within grace and session is active", async () => {
    const revoked = {
      id: "parent-token-id",
      user_id: user.id,
      token_hash: parent_hash,
      revoked: true,
      session_id: "session-1",
      session: {
        id: "session-1",
        user_id: user.id,
        expires_at: new Date(Date.now() + 60_000),
      },
    };
    const child = {
      id: "child-token-id",
      parent_id: revoked.id,
      token_hash: child_hash,
      revoked: false,
      session_id: "session-1",
      created_at: new Date(),
    };

    refreshTokenService.findRevokedByTokenHash.mockResolvedValue(revoked as any);
    refreshTokenService.findRecentActiveChildByParentId.mockResolvedValue(
      child as any,
    );
    refreshTokenService.getGraceRotation.mockReturnValue({
      raw_token: child_raw,
      token_hash: child_hash,
      cached_at: Date.now(),
    });
    userService.findOne.mockResolvedValue(user as any);
    jwtService.sign.mockReturnValue("access-jwt-from-child");

    const result = await authService.refreshToken(parent_raw);

    expect(result).toEqual({
      type: "session",
      token: "access-jwt-from-child",
      refresh_token: child_raw,
    });
    expect(sessionService.delete).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        refreshToken_hash: child_hash,
        session_id: "session-1",
      }),
      expect.anything(),
    );
  });

  it("does not delete session when revoked parent has recent child but no cached raw", async () => {
    const revoked = {
      id: "parent-token-id",
      user_id: user.id,
      token_hash: parent_hash,
      revoked: true,
      session_id: "session-1",
      session: {
        id: "session-1",
        user_id: user.id,
        expires_at: new Date(Date.now() + 60_000),
      },
    };
    const child = {
      id: "child-token-id",
      parent_id: revoked.id,
      token_hash: child_hash,
      revoked: false,
      created_at: new Date(),
    };

    refreshTokenService.findRevokedByTokenHash.mockResolvedValue(revoked as any);
    refreshTokenService.findRecentActiveChildByParentId.mockResolvedValue(
      child as any,
    );
    refreshTokenService.getGraceRotation.mockReturnValue(null);

    await expect(authService.refreshToken(parent_raw)).rejects.toThrow(
      UnauthorizedException,
    );
    await expect(authService.refreshToken(parent_raw)).rejects.toThrow(
      authResponseConfig.messages.INVALID_TOKEN,
    );
    expect(sessionService.delete).not.toHaveBeenCalled();
  });

  it("deletes session when revoked parent has no valid recent child", async () => {
    const revoked = {
      id: "parent-token-id",
      user_id: user.id,
      token_hash: parent_hash,
      revoked: true,
      session_id: "session-1",
      session: {
        id: "session-1",
        user_id: user.id,
        expires_at: new Date(Date.now() + 60_000),
      },
    };

    refreshTokenService.findRevokedByTokenHash.mockResolvedValue(revoked as any);
    refreshTokenService.findRecentActiveChildByParentId.mockResolvedValue(null);

    await expect(authService.refreshToken(parent_raw)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(sessionService.delete).toHaveBeenCalledWith("session-1");
  });
});
