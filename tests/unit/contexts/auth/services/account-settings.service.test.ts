import { createMock, Mock } from "@/tests/utils/mock";
import { AccountSettingsService } from "@/contexts/auth/services/account-settings.service";
import { UserService } from "@/contexts/users/services/user.service";

describe("AccountSettingsService", () => {
  let accountSettingsService: AccountSettingsService;
  let userService: Mock<UserService>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    provider: "local",
    last_sign_in: new Date(),
    created_at: "2024-01-01",
    two_factor_enabled: false,
    is_email_verified: true,
    profile: {
      name: "John",
      last_name: "Doe",
      avatar_url: null,
    },
  } as any;

  beforeEach(() => {
    userService = createMock<UserService>();
    accountSettingsService = new AccountSettingsService(userService);
  });

  describe("getAccountSettings", () => {
    it("should return account settings for a user", async () => {
      userService.findOne.mockResolvedValue(mockUser);
      userService.getBackupCodesRemaining.mockResolvedValue(5);

      const result = await accountSettingsService.getAccountSettings("user-1");

      expect(result.id).toBe("user-1");
      expect(result.email).toBe("test@example.com");
      expect(result.backup_codes_remaining).toBe(5);
      expect(result.two_factor_enabled).toBe(false);
      expect(result.is_email_verified).toBe(true);
      expect(userService.findOne).toHaveBeenCalledWith("user-1");
      expect(userService.getBackupCodesRemaining).toHaveBeenCalledWith("user-1");
    });
  });
});
