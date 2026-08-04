import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { Request } from "express";

import { createMock, Mock } from "@/tests/utils/mock";
import { AuthSessionService } from "@/contexts/auth/services/auth-session.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { SessionService } from "@/contexts/auth/services/session.service";
import { RefreshTokenService } from "@/contexts/auth/services/refresh-token.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { User } from "@/contexts/users/entities/user.entity";

describe("AuthSessionService.establishSessionForUser (new_login)", () => {
  let service: AuthSessionService;
  let suspensionService: Mock<SuspensionService>;
  let sessionService: Mock<SessionService>;
  let refreshTokenService: Mock<RefreshTokenService>;
  let jwtService: Mock<JwtService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;
  let userRepository: Mock<Repository<User>>;

  const request = {
    ip: "10.0.0.1",
    headers: { "user-agent": "Mozilla/5.0" },
  } as unknown as Request;

  beforeEach(() => {
    suspensionService = createMock<SuspensionService>();
    sessionService = createMock<SessionService>();
    refreshTokenService = createMock<RefreshTokenService>();
    jwtService = createMock<JwtService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();
    userRepository = createMock<Repository<User>>();

    service = new AuthSessionService(
      suspensionService,
      sessionService,
      refreshTokenService,
      jwtService,
      authSecurityMailService,
      userRepository,
    );

    sessionService.create.mockResolvedValue({ id: "session-1" } as any);
    refreshTokenService.createForSession.mockResolvedValue({
      entity: { token_hash: "hash" },
      raw_token: "refresh",
    } as any);
    jwtService.sign.mockReturnValue("token");
  });

  it("enqueues new_login when type is session and previous last_sign_in exists", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      two_factor_enabled: false,
      last_sign_in: new Date("2026-01-01"),
    } as User;

    const result = await service.establishSessionForUser(user, request);

    expect(result.type).toBe("session");
    expect(authSecurityMailService.enqueueNewLogin).toHaveBeenCalledWith({
      to: user.email,
      ip_address: "10.0.0.1",
      user_agent: "Mozilla/5.0",
      audience: "platform",
    });
  });

  it("does not enqueue new_login on first session (last_sign_in null)", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      two_factor_enabled: false,
      last_sign_in: null,
    } as User;

    await service.establishSessionForUser(user, request);

    expect(authSecurityMailService.enqueueNewLogin).not.toHaveBeenCalled();
  });

  it("does not enqueue new_login on 2fa_challenge; sets notify_new_login in token payload", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      two_factor_enabled: true,
      last_sign_in: new Date("2026-01-01"),
    } as User;

    const result = await service.establishSessionForUser(user, request);

    expect(result.type).toBe("2fa_challenge");
    expect(authSecurityMailService.enqueueNewLogin).not.toHaveBeenCalled();
    expect(jwtService.sign).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: "2fa_challenge",
        notify_new_login: true,
      }),
      expect.anything(),
    );
  });
});
