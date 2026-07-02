import { createMock, Mock } from "@/tests/utils/mock";
import { MeService } from "@/contexts/auth/services/me.service";
import { DealershipMemberRepository } from "@/contexts/dealership/domain/repositories/dealership-member.repository";

describe("MeService", () => {
  let meService: MeService;
  let dealershipMemberRepository: Mock<DealershipMemberRepository>;

  const mockMembershipDetail = {
    dealership_id: "dealership-1",
    dealership_name: "Test Dealership",
    member_id: "member-1",
    role: "owner" as const,
  };

  const mockUserWithProfile = {
    id: "user-1",
    email: "test@example.com",
    provider: "local",
    last_sign_in: new Date(),
    created_at: "2024-01-01",
    two_factor_enabled: false,
    is_email_verified: true,
    profile: {
      id: "profile-1",
      name: "John",
      last_name: "Doe",
      avatar_url: null,
      image_url: null,
      phone_code: null,
      phone: null,
      dni: null,
      vehicle_lists: [],
      type: "particular",
    },
  } as any;

  const mockUserWithoutProfileId = {
    id: "user-2",
    email: "test2@example.com",
    provider: "local",
    last_sign_in: null,
    created_at: "2024-01-01",
    two_factor_enabled: false,
    is_email_verified: true,
    profile: {
      id: null,
      name: "Jane",
      last_name: "Doe",
    },
  } as any;

  beforeEach(() => {
    dealershipMemberRepository = createMock<DealershipMemberRepository>();
    meService = new MeService(dealershipMemberRepository);
  });

  describe("getMe", () => {
    it("should return user with membership detail when profile.id exists", async () => {
      dealershipMemberRepository.findMembershipDetailByProfileId.mockResolvedValue(mockMembershipDetail);

      const result = await meService.getMe(mockUserWithProfile);

      expect(
        dealershipMemberRepository.findMembershipDetailByProfileId,
      ).toHaveBeenCalledWith("profile-1");
      expect(result.id).toBe("user-1");
      expect(result.type).toBe("session");
      expect(result.dealership_membership).toEqual({
        dealership_id: "dealership-1",
        dealership_name: "Test Dealership",
        member_id: "member-1",
        role: "owner",
      });
    });

    it("should return user with null membership when profile.id is null", async () => {
      const result = await meService.getMe(mockUserWithoutProfileId);

      expect(
        dealershipMemberRepository.findMembershipDetailByProfileId,
      ).not.toHaveBeenCalled();
      expect(result.dealership_membership).toBeNull();
    });

    it("should return 2fa_challenge type when scope is provided", async () => {
      const result = await meService.getMe(mockUserWithProfile, "2fa_challenge");

      expect(result.type).toBe("2fa_challenge");
    });
  });
});
