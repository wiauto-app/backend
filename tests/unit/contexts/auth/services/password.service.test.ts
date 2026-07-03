import { PasswordService } from "@/contexts/auth/services/password.service";

describe("PasswordService", () => {
  let passwordService: PasswordService;

  beforeAll(() => {
    passwordService = new PasswordService();
  });

  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const password = "myPassword123";
      const result = await passwordService.hashPassword(password);

      expect(result).not.toBe(password);
      expect(result.startsWith("$2b$")).toBe(true);
    });
  });

  describe("comparePassword", () => {
    it("should return true when passwords match", async () => {
      const password = "testPassword123";
      const hashed = await passwordService.hashPassword(password);
      const result = await passwordService.comparePassword(password, hashed);

      expect(result).toBe(true);
    });

    it("should return false when passwords do not match", async () => {
      const hashed = await passwordService.hashPassword("realPassword");
      const result = await passwordService.comparePassword("wrongPassword", hashed);

      expect(result).toBe(false);
    });

    it("should return false when compared against an invalid hash", async () => {
      const result = await passwordService.comparePassword("anyPassword", "not-a-valid-hash");

      expect(result).toBe(false);
    });
  });
});
