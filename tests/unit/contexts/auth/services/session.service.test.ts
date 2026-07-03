import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { SessionService } from "@/contexts/auth/services/session.service";
import { SessionEntity } from "@/contexts/auth/entities/session.entity";

describe("SessionService", () => {
  let sessionService: SessionService;
  let sessionRepository: Mock<Repository<SessionEntity>>;

  const mockSession = {
    id: "session-1",
    user_id: "user-1",
    created_at: new Date(),
    updated_at: new Date(),
    refreshed_at: new Date(),
    expires_at: new Date(Date.now() + 100000),
    ip_address: "127.0.0.1",
    user_agent: "Mozilla/5.0",
    refresh_tokens: [],
  } as any;

  beforeEach(() => {
    sessionRepository = createMock<Repository<SessionEntity>>();
    sessionService = new SessionService(sessionRepository);
  });

  describe("create", () => {
    it("should create a session", async () => {
      const user = { id: "user-1" } as any;
      const request = {
        ip: "127.0.0.1",
        headers: { "user-agent": "Mozilla/5.0" },
      } as any;

      sessionRepository.create.mockReturnValue(mockSession);
      sessionRepository.save.mockResolvedValue(mockSession);

      const result = await sessionService.create(user, request);

      expect(result).toEqual(mockSession);
      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          ip_address: "127.0.0.1",
        }),
      );
    });

    it("should handle missing user-agent", async () => {
      const user = { id: "user-1" } as any;
      const request = { ip: "127.0.0.1", headers: {} } as any;

      sessionRepository.create.mockReturnValue({ ...mockSession, user_agent: null });
      sessionRepository.save.mockResolvedValue({ ...mockSession, user_agent: null });

      const result = await sessionService.create(user, request);

      expect(result.user_agent).toBeNull();
    });
  });

  describe("update", () => {
    it("should update a session", async () => {
      sessionRepository.preload.mockResolvedValue(mockSession);
      sessionRepository.save.mockResolvedValue(mockSession);

      const result = await sessionService.update("session-1", {
        ip_address: "192.168.1.1",
      });

      expect(result).toEqual(mockSession);
      expect(sessionRepository.preload).toHaveBeenCalledWith({
        id: "session-1",
        ip_address: "192.168.1.1",
      });
    });

    it("should throw NotFoundException when session not found", async () => {
      sessionRepository.preload.mockResolvedValue(null);

      await expect(
        sessionService.update("invalid-id", {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("findOne", () => {
    it("should find a session by id", async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await sessionService.findOne("session-1");

      expect(result).toEqual(mockSession);
    });

    it("should throw UnauthorizedException when session not found", async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(sessionService.findOne("invalid-id")).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("findActiveById", () => {
    it("should find an active session", async () => {
      sessionRepository.findOne.mockResolvedValue(mockSession);

      const result = await sessionService.findActiveById("session-1");

      expect(result).toEqual(mockSession);
    });

    it("should throw when session is expired", async () => {
      const expiredSession = {
        ...mockSession,
        expires_at: new Date(Date.now() - 100000),
      };
      sessionRepository.findOne.mockResolvedValue(expiredSession);

      await expect(
        sessionService.findActiveById("session-1"),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw when session not found", async () => {
      sessionRepository.findOne.mockResolvedValue(null);

      await expect(
        sessionService.findActiveById("invalid-id"),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("delete", () => {
    it("should delete a session", async () => {
      sessionRepository.delete.mockResolvedValue({ affected: 1 } as any);

      await sessionService.delete("session-1");

      expect(sessionRepository.delete).toHaveBeenCalledWith("session-1");
    });
  });
});
