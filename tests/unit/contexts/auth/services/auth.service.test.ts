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

describe("AuthService", () => {
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

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    password: "hashed-password",
    provider: "local",
    is_email_verified: true,
    two_factor_enabled: false,
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

  describe("signIn", () => {
    const loginDto = { email: "test@example.com", password: "password123" };
    const request = { ip: "127.0.0.1", headers: { "user-agent": "test" } } as any;

    it("should sign in a user with valid credentials", async () => {
      userService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
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
      expect(userService.findOneByEmailWithPassword).toHaveBeenCalledWith(loginDto.email);
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });

    it("should throw if user provider is not local", async () => {
      const googleUser = { ...mockUser, provider: "google", password: null };
      userService.findOneByEmailWithPassword.mockResolvedValue(googleUser);

      await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw if password is invalid", async () => {
      userService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      passwordService.comparePassword.mockResolvedValue(false);

      await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw if email is not verified", async () => {
      const unverifiedUser = { ...mockUser, is_email_verified: false };
      userService.findOneByEmailWithPassword.mockResolvedValue(unverifiedUser);
      passwordService.comparePassword.mockResolvedValue(true);

      await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should skip password check when ignorePassword is true", async () => {
      userService.findOneByEmailWithPassword.mockResolvedValue(mockUser);
      authSessionService.establishSessionForUser.mockResolvedValue({
        type: "session",
        token: "jwt-token",
        refresh_token: "refresh-token",
      });

      const result = await authService.signIn({ loginDto, request, ignorePassword: true });

      expect(result).toEqual({
        type: "session",
        token: "jwt-token",
        refresh_token: "refresh-token",
      });
      expect(passwordService.comparePassword).not.toHaveBeenCalled();
    });

    it("should throw if user has no password and provider is local", async () => {
      const noPasswordUser = { ...mockUser, password: null };
      userService.findOneByEmailWithPassword.mockResolvedValue(noPasswordUser);

      await expect(authService.signIn({ loginDto, request })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("signInWithOAuthProfile", () => {
    it("should sign in with OAuth profile", async () => {
      const profile = {
        provider: "google",
        provider_id: "google-123",
        email: "oauth@example.com",
        first_name: "John",
        last_name: "Doe",
      };
      const role = { id: "role-1", is_default: true };
      roleService.findDefault.mockResolvedValue(role as any);
      userService.findOrCreateOAuthUser.mockResolvedValue(mockUser);
      authSessionService.establishSessionForUser.mockResolvedValue({
        type: "session",
        token: "jwt-token",
        refresh_token: "refresh-token",
      });

      const result = await authService.signInWithOAuthProfile(profile, {} as any);

      expect(result).toEqual({
        type: "session",
        token: "jwt-token",
        refresh_token: "refresh-token",
      });
      expect(userService.findOrCreateOAuthUser).toHaveBeenCalledWith({
        ...profile,
        role_id: role.id,
      });
    });

    it("should throw if profile has no email", async () => {
      const profile = { provider: "google", provider_id: "123", email: "" } as any;

      await expect(authService.signInWithOAuthProfile(profile, {} as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw if no default role found", async () => {
      roleService.findDefault.mockResolvedValue(null);

      await expect(
        authService.signInWithOAuthProfile(
          { provider: "google", provider_id: "123", email: "test@test.com" } as any,
          {} as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should propagate error when establishSessionForUser throws in OAuth", async () => {
      const profile = {
        provider: "google",
        provider_id: "google-123",
        email: "oauth@example.com",
        first_name: "John",
        last_name: "Doe",
      };
      const role = { id: "role-1", is_default: true };
      roleService.findDefault.mockResolvedValue(role as any);
      userService.findOrCreateOAuthUser.mockResolvedValue(mockUser);
      authSessionService.establishSessionForUser.mockRejectedValue(
        new UnauthorizedException(),
      );

      await expect(
        authService.signInWithOAuthProfile(profile, {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("createToken", () => {
    it("should create a JWT token", async () => {
      jwtService.sign.mockReturnValue("signed-jwt");

      const token = authService.createToken({
        user: mockUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });

      expect(token).toBe("signed-jwt");
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          session_id: "session-1",
        }),
        expect.any(Object),
      );
    });

    it("should set scope to 2fa_challenge when user has 2fa enabled", () => {
      const twoFaUser = { ...mockUser, two_factor_enabled: true };
      jwtService.sign.mockReturnValue("signed-jwt");

      authService.createToken({
        user: twoFaUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "2fa_challenge" }),
        expect.any(Object),
      );
    });
  });

  describe("createSession", () => {
    it("should delegate to authSessionService.createSession", async () => {
      const mockResult = {
        session_id: "session-1",
        refresh_token: "rt",
        refresh_token_hash: "hash",
      };
      authSessionService.createSession.mockResolvedValue(mockResult);

      const result = await authService.createSession(mockUser, {} as any);

      expect(result).toEqual(mockResult);
      expect(authSessionService.createSession).toHaveBeenCalledWith(mockUser, {});
    });
  });

  describe("createVerifiedSessionToken", () => {
    it("should call createToken with scope session", () => {
      jwtService.sign.mockReturnValue("signed-jwt");

      const token = authService.createVerifiedSessionToken({
        user: mockUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });

      expect(token).toBe("signed-jwt");
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "session" }),
        expect.any(Object),
      );
    });
  });

  describe("createToken", () => {
    it("should override scope when explicitly provided", () => {
      jwtService.sign.mockReturnValue("signed-jwt");

      const token = authService.createToken({
        user: mockUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
        scope: "2fa_challenge",
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "2fa_challenge" }),
        expect.any(Object),
      );
    });
  });

  describe("logout", () => {
    it("should delete session", async () => {
      await authService.logout("session-1");
      expect(sessionService.delete).toHaveBeenCalledWith("session-1");
    });

    it("should do nothing if session_id is empty", async () => {
      await authService.logout("");
      expect(sessionService.delete).not.toHaveBeenCalled();
    });

    it("should do nothing if session_id is null", async () => {
      await authService.logout(null as any);
      expect(sessionService.delete).not.toHaveBeenCalled();
    });

    it("should do nothing if session_id is undefined", async () => {
      await authService.logout(undefined as any);
      expect(sessionService.delete).not.toHaveBeenCalled();
    });
  });

  describe("refreshToken", () => {
    it("should refresh a token", async () => {
      const refreshTokenServiceFindRevoked = refreshTokenService.findRevokedByTokenHash as any;
      const refreshTokenServiceFindByRaw = refreshTokenService.findByRawToken as any;
      const refreshTokenServiceFindByRawToken = refreshTokenService.findByRawToken as any;

      refreshTokenService.findRevokedByTokenHash.mockResolvedValue(null);
      refreshTokenService.findByRawToken.mockResolvedValue({
        session_id: "session-1",
        session: { user_id: "user-1" },
        id: "refresh-1",
      });
      userService.findOne.mockResolvedValue(mockUser);
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          update: vi.fn(),
          create: vi.fn().mockReturnValue({ token_hash: "new-hash" }),
          save: vi.fn().mockResolvedValue({ token_hash: "new-hash" }),
          preload: vi.fn().mockResolvedValue({ id: "session-1" }),
        };
        return cb(manager);
      });
      jwtService.sign.mockReturnValue("new-jwt");

      const result = await authService.refreshToken("raw-refresh-token");

      expect(result).toEqual({
        type: "session",
        token: "new-jwt",
        refresh_token: expect.any(String),
      });
    });

    it("should throw if refresh token was revoked", async () => {
      refreshTokenService.findRevokedByTokenHash.mockResolvedValue({
        session_id: "session-1",
      } as any);
      sessionService.delete.mockResolvedValue(undefined);

      await expect(authService.refreshToken("revoked-token")).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessionService.delete).toHaveBeenCalledWith("session-1");
    });

    it("should return 2fa_challenge type when user has 2fa enabled in refreshToken", async () => {
      const twoFaUser = { ...mockUser, two_factor_enabled: true };
      refreshTokenService.findRevokedByTokenHash.mockResolvedValue(null);
      refreshTokenService.findByRawToken.mockResolvedValue({
        session_id: "session-1",
        session: { user_id: "user-1" },
        id: "refresh-1",
      } as any);
      userService.findOne.mockResolvedValue(twoFaUser);
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          update: vi.fn(),
          create: vi.fn().mockReturnValue({ token_hash: "new-hash" }),
          save: vi.fn().mockResolvedValue({ token_hash: "new-hash" }),
          preload: vi.fn().mockResolvedValue({ id: "session-1" }),
        };
        return cb(manager);
      });
      jwtService.sign.mockReturnValue("new-jwt");

      const result = await authService.refreshToken("raw-refresh-token");

      expect(result.type).toBe("2fa_challenge");
    });

    it("should throw when session preload returns null in refreshToken", async () => {
      refreshTokenService.findRevokedByTokenHash.mockResolvedValue(null);
      refreshTokenService.findByRawToken.mockResolvedValue({
        session_id: "session-1",
        session: { user_id: "user-1" },
        id: "refresh-1",
      } as any);
      userService.findOne.mockResolvedValue(mockUser);
      dataSource.transaction.mockImplementation(async (cb: any) => {
        const manager = {
          update: vi.fn(),
          create: vi.fn().mockReturnValue({ token_hash: "new-hash" }),
          save: vi.fn(),
          preload: vi.fn().mockResolvedValue(null),
        };
        return cb(manager);
      });

      await expect(authService.refreshToken("raw-token")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
