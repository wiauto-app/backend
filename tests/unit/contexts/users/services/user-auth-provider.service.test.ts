import { NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { UserAuthProviderService } from "@/contexts/users/services/user-auth-provider.service";
import { UserAuthProvider } from "@/contexts/users/entities/user-auth-provider.entity";
import { User } from "@/contexts/users/entities/user.entity";

describe("UserAuthProviderService", () => {
  let service: UserAuthProviderService;
  let userAuthProviderRepository: Mock<Repository<UserAuthProvider>>;
  let userRepository: Mock<Repository<User>>;

  beforeEach(() => {
    userAuthProviderRepository = createMock<Repository<UserAuthProvider>>();
    userRepository = createMock<Repository<User>>();
    service = new UserAuthProviderService(
      userAuthProviderRepository,
      userRepository,
    );
  });

  describe("linkProvider", () => {
    it("creates a new identity when none exists", async () => {
      userAuthProviderRepository.findOne.mockResolvedValue(null);
      const created = {
        id: "identity-1",
        user_id: "user-1",
        provider: "google",
        provider_id: "google-123",
      };
      userAuthProviderRepository.create.mockReturnValue(created as any);
      userAuthProviderRepository.save.mockResolvedValue(created as any);

      const result = await service.linkProvider(
        "user-1",
        "google",
        "google-123",
      );

      expect(result).toEqual(created);
      expect(userAuthProviderRepository.create).toHaveBeenCalledWith({
        user_id: "user-1",
        provider: "google",
        provider_id: "google-123",
      });
    });

    it("is idempotent when the same provider_id already exists", async () => {
      const existing = {
        id: "identity-1",
        user_id: "user-1",
        provider: "google",
        provider_id: "google-123",
      };
      userAuthProviderRepository.findOne.mockResolvedValue(existing as any);

      const result = await service.linkProvider(
        "user-1",
        "google",
        "google-123",
      );

      expect(result).toEqual(existing);
      expect(userAuthProviderRepository.create).not.toHaveBeenCalled();
      expect(userAuthProviderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe("getAuthIdentitySummary", () => {
    it("includes local when password exists plus linked OAuth providers", async () => {
      const qb = {
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: "user-1",
          password: "hashed",
          auth_providers: [
            { provider: "google" },
            { provider: "apple" },
          ],
        }),
      };
      userRepository.createQueryBuilder.mockReturnValue(qb as any);

      const summary = await service.getAuthIdentitySummary("user-1");

      expect(summary).toEqual({
        providers: ["local", "google", "apple"],
        has_password: true,
      });
    });

    it("omits local when there is no password", async () => {
      const qb = {
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue({
          id: "user-1",
          password: null,
          auth_providers: [{ provider: "google" }],
        }),
      };
      userRepository.createQueryBuilder.mockReturnValue(qb as any);

      const summary = await service.getAuthIdentitySummary("user-1");

      expect(summary).toEqual({
        providers: ["google"],
        has_password: false,
      });
    });

    it("throws when user does not exist", async () => {
      const qb = {
        addSelect: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      userRepository.createQueryBuilder.mockReturnValue(qb as any);

      await expect(service.getAuthIdentitySummary("missing")).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
