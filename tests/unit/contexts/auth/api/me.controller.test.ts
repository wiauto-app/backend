import { createMock, Mock } from "@/tests/utils/mock";
import { MeController } from "@/contexts/auth/api/me.controller";
import { MeService } from "@/contexts/auth/services/me.service";
import { AccountSettingsService } from "@/contexts/auth/services/account-settings.service";
import { UserService } from "@/contexts/users/services/user.service";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";

describe("MeController", () => {
  let meController: MeController;
  let meService: Mock<MeService>;
  let accountSettingsService: Mock<AccountSettingsService>;
  let userService: Mock<UserService>;
  let emailVerificationService: Mock<EmailVerificationService>;

  beforeEach(() => {
    meService = createMock<MeService>();
    accountSettingsService = createMock<AccountSettingsService>();
    userService = createMock<UserService>();
    emailVerificationService = createMock<EmailVerificationService>();

    meController = new MeController(
      meService,
      accountSettingsService,
      userService,
      emailVerificationService,
    );
  });

  describe("getMe", () => {
    it("should return current user", async () => {
      const user = { id: "user-1" } as any;
      const req = { auth_scope: "session" } as any;
      const expected = { id: "user-1", email: "test@test.com" } as any;
      meService.getMe.mockResolvedValue(expected);

      const result = await meController.getMe(user, req);

      expect(meService.getMe).toHaveBeenCalledWith(user, "session");
      expect(result).toEqual(expected);
    });
  });

  describe("getAccountSettings", () => {
    it("should return account settings", async () => {
      const expected = { id: "user-1", two_factor_enabled: false } as any;
      accountSettingsService.getAccountSettings.mockResolvedValue(expected);

      const result = await meController.getAccountSettings("user-1");

      expect(accountSettingsService.getAccountSettings).toHaveBeenCalledWith("user-1");
      expect(result).toEqual(expected);
    });
  });

  describe("updateEmail", () => {
    it("should update email and enqueue verification", async () => {
      userService.updateEmail.mockResolvedValue({ message: "Email updated", data: null } as any);
      emailVerificationService.enqueueSendVerificationForUser.mockResolvedValue(undefined);

      const result = await meController.updateEmail("user-1", { email: "new@test.com" } as any);

      expect(userService.updateEmail).toHaveBeenCalledWith(
        { email: "new@test.com" },
        "user-1",
      );
      expect(emailVerificationService.enqueueSendVerificationForUser).toHaveBeenCalledWith(
        "user-1",
        "new@test.com",
      );
      expect(result).toEqual({ message: "Email updated", data: null });
    });
  });

  describe("updatePassword", () => {
    it("should update password", async () => {
      userService.updatePassword.mockResolvedValue({ message: "Password updated", data: null } as any);

      const result = await meController.updatePassword("user-1", {
        current_password: "old",
        password: "new-password-123",
      } as any);

      expect(userService.updatePassword).toHaveBeenCalledWith(
        {
          current_password: "old",
          password: "new-password-123",
        },
        "user-1",
      );
      expect(result).toEqual({ message: "Password updated", data: null });
    });
  });
});
