import { describe, expect, it, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

vi.mock("@/src/common/envs", () => ({
  envs: { ADMIN_PASSWORD: "__admin__", ACCESS_TOKEN_EXPIRES_IN: "30d" },
}));

vi.mock("@/src/contexts/auth/utils/passwordUtils", () => ({
  comparePassword: vi.fn(),
}));

vi.mock("@/src/contexts/users/services/user.service", () => ({
  UserService: vi.fn(),
}));
vi.mock("@/src/contexts/users/services/suspension.service", () => ({
  SuspensionService: vi.fn(),
}));
vi.mock("@/src/contexts/auth/services/refresh-token.service", () => ({
  RefreshTokenService: vi.fn(),
}));
vi.mock("@/src/contexts/auth/services/session.service", () => ({
  SessionService: vi.fn(),
}));
vi.mock("@/src/contexts/auth/services/auth-session.service", () => ({
  AuthSessionService: vi.fn(),
}));
vi.mock("@nestjs/jwt", () => ({
  JwtService: vi.fn(),
}));

import { comparePassword } from "@/src/contexts/auth/utils/passwordUtils";
import { AuthService } from "@/src/contexts/auth/services/auth.service";

describe("AuthService", () => {
  const request = { ip: "127.0.0.1", headers: {} } as Request;

  const buildService = () => {
    const userService = {
      findOneByEmailWithPassword: vi.fn(),
    };
    const authSessionService = {
      establishSessionForUser: vi.fn().mockResolvedValue({
        type: "session",
        token: "access-token",
        refresh_token: "refresh-hash",
      }),
    };

    const service = new AuthService(
      userService as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      authSessionService as never,
    );

    return { service, userService, authSessionService };
  };

  beforeEach(() => {
    vi.mocked(comparePassword).mockReset();
  });

  describe("signIn", () => {
    it("permite iniciar sesión si el email no está verificado", async () => {
      const { service, userService, authSessionService } = buildService();
      const user = {
        id: "user-1",
        email: "test@example.com",
        password: "hashed",
        is_email_verified: false,
        two_factor_enabled: false,
      };

      userService.findOneByEmailWithPassword.mockResolvedValue(user);
      vi.mocked(comparePassword).mockResolvedValue(true);

      const result = await service.signIn({
        loginDto: { email: user.email, password: "secret12" },
        request,
      });

      expect(result).toEqual({
        type: "session",
        token: "access-token",
        refresh_token: "refresh-hash",
      });
      expect(authSessionService.establishSessionForUser).toHaveBeenCalledWith(
        user,
        request,
      );
    });

    it("sigue rechazando credenciales inválidas", async () => {
      const { service, userService, authSessionService } = buildService();
      userService.findOneByEmailWithPassword.mockResolvedValue({
        id: "user-1",
        email: "test@example.com",
        password: "hashed",
        is_email_verified: true,
      });
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(
        service.signIn({
          loginDto: { email: "test@example.com", password: "wrong" },
          request,
        }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(authSessionService.establishSessionForUser).not.toHaveBeenCalled();
    });
  });
});
