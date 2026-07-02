import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { RefreshTokenService } from "@/contexts/auth/services/refresh-token.service";
import { SuspensionService } from "@/contexts/users/services/suspension.service";
import { RefreshTokenEntity } from "@/contexts/auth/entities/refresh-token.entity";

describe("RefreshTokenService", () => {
  let refreshTokenService: RefreshTokenService;
  let refreshTokenRepository: Mock<Repository<RefreshTokenEntity>>;
  let suspensionService: Mock<SuspensionService>;

  const mockEntity = {
    id: "refresh-1",
    token_hash: "hashed-token",
    user_id: "user-1",
    session_id: "session-1",
    revoked: false,
    expires_at: new Date(Date.now() + 100000),
    session: { user_id: "user-1", id: "session-1" },
  } as any;

  beforeEach(() => {
    refreshTokenRepository = createMock<Repository<RefreshTokenEntity>>();
    suspensionService = createMock<SuspensionService>();
    refreshTokenService = new RefreshTokenService(
      refreshTokenRepository,
      suspensionService,
    );
  });

  describe("createForSession", () => {
    it("should create a refresh token for a session", async () => {
      const user = { id: "user-1" } as any;
      const session = { id: "session-1" } as any;

      refreshTokenRepository.create.mockReturnValue(mockEntity);
      refreshTokenRepository.save.mockResolvedValue(mockEntity);

      const result = await refreshTokenService.createForSession(user, session);

      expect(result.raw_token).toEqual(expect.any(String));
      expect(result.raw_token.length).toBeGreaterThan(0);
      expect(result.entity).toEqual(mockEntity);
      expect(refreshTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          session_id: "session-1",
          revoked: false,
        }),
      );
    });
  });

  describe("findByTokenHash", () => {
    it("should find a non-revoked, non-expired token by hash", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockEntity);
      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);

      const result = await refreshTokenService.findByTokenHash("some-hash");

      expect(result).toEqual(mockEntity);
    });

    it("should throw UnauthorizedException when token not found", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        refreshTokenService.findByTokenHash("invalid-hash"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("findByRawToken", () => {
    it("should find by raw token by hashing it first", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockEntity);
      suspensionService.assert_session_allowed_by_id.mockResolvedValue(undefined);

      const result = await refreshTokenService.findByRawToken("raw-token");

      expect(result).toEqual(mockEntity);
    });
  });

  describe("findRevokedByTokenHash", () => {
    it("should find a revoked token", async () => {
      const revokedEntity = { ...mockEntity, revoked: true };
      refreshTokenRepository.findOne.mockResolvedValue(revokedEntity);

      const result = await refreshTokenService.findRevokedByTokenHash("some-hash");

      expect(result).toEqual(revokedEntity);
    });

    it("should return null when no revoked token found", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      const result = await refreshTokenService.findRevokedByTokenHash("some-hash");

      expect(result).toBeNull();
    });
  });

  describe("findBySessionId", () => {
    it("should find token by session id", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(mockEntity);

      const result = await refreshTokenService.findBySessionId("session-1");

      expect(result).toEqual(mockEntity);
    });

    it("should throw NotFoundException when not found", async () => {
      refreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(
        refreshTokenService.findBySessionId("invalid-session"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("revoke", () => {
    it("should revoke a token", async () => {
      refreshTokenRepository.preload.mockResolvedValue(mockEntity);
      refreshTokenRepository.save.mockResolvedValue({ ...mockEntity, revoked: true });

      await refreshTokenService.revoke(mockEntity);

      expect(refreshTokenRepository.preload).toHaveBeenCalledWith({
        id: mockEntity.id,
        revoked: true,
      });
    });

    it("should throw NotFoundException when token not found to revoke", async () => {
      refreshTokenRepository.preload.mockResolvedValue(null);

      await expect(refreshTokenService.revoke(mockEntity)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("revokeBySessionId", () => {
    it("should revoke all tokens by session id", async () => {
      refreshTokenRepository.update.mockResolvedValue({ affected: 1 } as any);

      await refreshTokenService.revokeBySessionId("session-1");

      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { session_id: "session-1" },
        { revoked: true },
      );
    });
  });
});
