import { createMock, Mock } from "@/tests/utils/mock";
import { PasswordRecoveryController } from "@/contexts/auth/api/password-recovery.controller";
import { PasswordRecoveryService } from "@/contexts/auth/services/password-recovery.service";

describe("PasswordRecoveryController", () => {
  let passwordRecoveryController: PasswordRecoveryController;
  let passwordRecoveryService: Mock<PasswordRecoveryService>;

  beforeEach(() => {
    passwordRecoveryService = createMock<PasswordRecoveryService>();
    passwordRecoveryController = new PasswordRecoveryController(passwordRecoveryService);
  });

  describe("request", () => {
    it("should call service and return success message", async () => {
      passwordRecoveryService.requestRecovery.mockResolvedValue(undefined);

      const result = await passwordRecoveryController.request({ email: "test@test.com" } as any);

      expect(passwordRecoveryService.requestRecovery).toHaveBeenCalledWith("test@test.com");
      expect(result.message).toBeDefined();
    });
  });

  describe("change", () => {
    it("should call service and return success message", async () => {
      passwordRecoveryService.changePassword.mockResolvedValue(undefined);

      const result = await passwordRecoveryController.change({
        token: "reset-token",
        password: "new-password",
      } as any);

      expect(passwordRecoveryService.changePassword).toHaveBeenCalledWith(
        "reset-token",
        "new-password",
      );
      expect(result.message).toBeDefined();
    });
  });
});
