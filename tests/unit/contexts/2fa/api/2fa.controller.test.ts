import { ConflictException, NotFoundException } from "@nestjs/common";

import { createMock, Mock } from "@/tests/utils/mock";
import { TwoFactorAuthController } from "@/contexts/2fa/api/2fa.controller";
import { TwoFactorAuthService } from "@/contexts/2fa/services/2fa.service";

describe("TwoFactorAuthController", () => {
  let controller: TwoFactorAuthController;
  let twoFactorAuthService: Mock<TwoFactorAuthService>;

  const userId = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    twoFactorAuthService = createMock<TwoFactorAuthService>();
    controller = new TwoFactorAuthController(twoFactorAuthService);
  });

  describe("setup", () => {
    it("should call twoFactorAuthService.setup with user id", () => {
      const expected = { otpauth_url: "otpauth://...", qr_code_data_url: "data:image/..." } as any;
      twoFactorAuthService.setup.mockReturnValue(expected);

      const result = controller.setup(userId);

      expect(twoFactorAuthService.setup).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.setup throws", () => {
      twoFactorAuthService.setup.mockImplementation(() => { throw new ConflictException("2FA ya está habilitado"); });

      expect(() => controller.setup(userId)).toThrow(ConflictException);
    });
  });

  describe("activate", () => {
    it("should call twoFactorAuthService.activate with user id", () => {
      const expected = { verified: true, message: "Se ha habilitado el autenticador correctamente" } as any;
      twoFactorAuthService.activate.mockReturnValue(expected);

      const result = controller.activate(userId);

      expect(twoFactorAuthService.activate).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.activate throws", () => {
      twoFactorAuthService.activate.mockImplementation(() => { throw new ConflictException("2FA ya está habilitado"); });

      expect(() => controller.activate(userId)).toThrow(ConflictException);
    });
  });

  describe("enable", () => {
    it("should call twoFactorAuthService.enable with user id", () => {
      const expected = { message: "Se ha habilitado el autenticador correctamente" } as any;
      twoFactorAuthService.enable.mockReturnValue(expected);

      const result = controller.enable(userId);

      expect(twoFactorAuthService.enable).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.enable throws", () => {
      twoFactorAuthService.enable.mockImplementation(() => { throw new ConflictException("2FA ya está habilitado"); });

      expect(() => controller.enable(userId)).toThrow(ConflictException);
    });
  });

  describe("disable", () => {
    it("should call twoFactorAuthService.disable with user id", () => {
      const expected = { message: "Se ha deshabilitado el autenticador correctamente" } as any;
      twoFactorAuthService.disable.mockReturnValue(expected);

      const result = controller.disable(userId);

      expect(twoFactorAuthService.disable).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.disable throws", () => {
      twoFactorAuthService.disable.mockImplementation(() => { throw new NotFoundException("Usuario no encontrado"); });

      expect(() => controller.disable(userId)).toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should call twoFactorAuthService.delete with user id", () => {
      const expected = { message: "Se ha eliminado el autenticador correctamente" } as any;
      twoFactorAuthService.delete.mockReturnValue(expected);

      const result = controller.delete(userId);

      expect(twoFactorAuthService.delete).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.delete throws", () => {
      twoFactorAuthService.delete.mockImplementation(() => { throw new NotFoundException("Usuario no encontrado"); });

      expect(() => controller.delete(userId)).toThrow(NotFoundException);
    });
  });

  describe("validateBackupCode", () => {
    it("should call twoFactorAuthService.validateBackupCode with dto and request", () => {
      const dto = { code: "ABC-DEF", email: "test@test.com" } as any;
      const req = { ip: "127.0.0.1" } as any;
      const expected = { message: "Código de respaldo validado correctamente", token: "jwt" } as any;
      twoFactorAuthService.validateBackupCode.mockReturnValue(expected);

      const result = controller.validateBackupCode(dto, req);

      expect(twoFactorAuthService.validateBackupCode).toHaveBeenCalledWith(dto, req);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.validateBackupCode throws", () => {
      const dto = { code: "INVALID", email: "test@test.com" } as any;
      const req = { ip: "127.0.0.1" } as any;
      twoFactorAuthService.validateBackupCode.mockImplementation(() => { throw new NotFoundException("Código de respaldo incorrecto"); });

      expect(() => controller.validateBackupCode(dto, req)).toThrow(NotFoundException);
    });
  });

  describe("regenerateBackupCodes", () => {
    it("should call twoFactorAuthService.regenerateBackupCodes with user id", () => {
      const expected = { message: "Códigos de respaldo regenerados correctamente", backup_codes: ["KNSQ-SMS8"] } as any;
      twoFactorAuthService.regenerateBackupCodes.mockReturnValue(expected);

      const result = controller.regenerateBackupCodes(userId);

      expect(twoFactorAuthService.regenerateBackupCodes).toHaveBeenCalledWith(userId);
      expect(result).toBe(expected);
    });

    it("should throw when twoFactorAuthService.regenerateBackupCodes throws", () => {
      twoFactorAuthService.regenerateBackupCodes.mockImplementation(() => { throw new NotFoundException("Usuario no encontrado"); });

      expect(() => controller.regenerateBackupCodes(userId)).toThrow(NotFoundException);
    });
  });
});
