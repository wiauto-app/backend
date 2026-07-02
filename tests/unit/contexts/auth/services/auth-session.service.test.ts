import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { AuthSessionService } from "@/contexts/auth/services/auth-session.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { SessionService } from "@/contexts/auth/services/session.service";
import { RefreshTokenService } from "@/contexts/auth/services/refresh-token.service";
import { User } from "@/contexts/users/entities/user.entity";

describe("AuthSessionService", () => {
  let authSessionService: AuthSessionService;
  let suspensionService: Mock<SuspensionService>;
  let sessionService: Mock<SessionService>;
  let refreshTokenService: Mock<RefreshTokenService>;
  let jwtService: Mock<JwtService>;
  let userRepository: Mock<Repository<User>>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    two_factor_enabled: false,
  } as any;

  const mockSession = { id: "session-1" } as any;
  const mockRefreshToken = {
    entity: { token_hash: "hash-1" },
    raw_token: "raw-refresh-token",
  };

  beforeEach(() => {
    suspensionService = createMock<SuspensionService>();
    sessionService = createMock<SessionService>();
    refreshTokenService = createMock<RefreshTokenService>();
    jwtService = createMock<JwtService>();
    userRepository = createMock<Repository<User>>();

    authSessionService = new AuthSessionService(
      suspensionService,
      sessionService,
      refreshTokenService,
      jwtService,
      userRepository,
    );
  });

  describe("establishSessionForUser", () => {
    it("should establish a session and return tokens", async () => {
      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);
      sessionService.create.mockResolvedValue(mockSession);
      refreshTokenService.createForSession.mockResolvedValue(mockRefreshToken);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);
      jwtService.sign.mockReturnValue("signed-jwt");

      const result = await authSessionService.establishSessionForUser(
        mockUser,
        {} as any,
      );

      expect(result).toEqual({
        type: "session",
        token: "signed-jwt",
        refresh_token: "raw-refresh-token",
      });
      expect(suspensionService.assert_session_allowed_by_id).toHaveBeenCalledWith("user-1");
      expect(userRepository.update).toHaveBeenCalledWith("user-1", {
        last_sign_in: expect.any(Date),
      });
    });

    it("should return 2fa_challenge type when user has 2fa enabled", async () => {
      const twoFaUser = { ...mockUser, two_factor_enabled: true };

      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);
      sessionService.create.mockResolvedValue(mockSession);
      refreshTokenService.createForSession.mockResolvedValue(mockRefreshToken);
      userRepository.update.mockResolvedValue({ affected: 1 } as any);
      jwtService.sign.mockReturnValue("signed-jwt");

      const result = await authSessionService.establishSessionForUser(
        twoFaUser,
        {} as any,
      );

      expect(result.type).toBe("2fa_challenge");
    });

    it("should throw when suspension check fails", async () => {
      suspensionService.assert_session_allowed_by_id.mockRejectedValue(
        new UnauthorizedException("User is suspended"),
      );

      await expect(
        authSessionService.establishSessionForUser(mockUser, {} as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(sessionService.create).not.toHaveBeenCalled();
    });

    it("should throw when sessionService.create fails", async () => {
      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);
      sessionService.create.mockRejectedValue(new Error("Session creation failed"));

      await expect(
        authSessionService.establishSessionForUser(mockUser, {} as any),
      ).rejects.toThrow("Session creation failed");
    });
  });

  describe("createSession", () => {
    it("should create a session and refresh token", async () => {
      sessionService.create.mockResolvedValue(mockSession);
      refreshTokenService.createForSession.mockResolvedValue(mockRefreshToken);

      const result = await authSessionService.createSession(mockUser, {} as any);

      expect(result).toEqual({
        session_id: "session-1",
        refresh_token: "raw-refresh-token",
        refresh_token_hash: "hash-1",
      });
    });

    it("should throw when refreshTokenService.createForSession fails", async () => {
      sessionService.create.mockResolvedValue(mockSession);
      refreshTokenService.createForSession.mockRejectedValue(
        new Error("Token creation failed"),
      );

      await expect(
        authSessionService.createSession(mockUser, {} as any),
      ).rejects.toThrow("Token creation failed");
    });
  });

  describe("signSessionToken", () => {
    it("should sign a JWT with default scope for non-2fa user", () => {
      jwtService.sign.mockReturnValue("signed-jwt");

      const token = authSessionService.signSessionToken({
        user: mockUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });

      expect(token).toBe("signed-jwt");
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "user-1",
          email: "test@example.com",
          session_id: "session-1",
          refreshToken_hash: "hash-1",
          scope: "session",
        }),
        expect.any(Object),
      );
    });

    it("should sign a JWT with 2fa_challenge scope for 2fa user", () => {
      const twoFaUser = { ...mockUser, two_factor_enabled: true };
      jwtService.sign.mockReturnValue("signed-jwt");

      const token = authSessionService.signSessionToken({
        user: twoFaUser,
        session_id: "session-1",
        refresh_token_hash: "hash-1",
      });

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ scope: "2fa_challenge" }),
        expect.any(Object),
      );
    });

    it("should use explicit scope override when provided", () => {
      jwtService.sign.mockReturnValue("signed-jwt");

      authSessionService.signSessionToken({
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
});
