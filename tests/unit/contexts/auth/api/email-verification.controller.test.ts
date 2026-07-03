import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { Request, Response } from "express";

import { createMock, Mock } from "@/tests/utils/mock";
import { EmailVerificationController } from "@/contexts/auth/api/email-verification.controller";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";

describe("EmailVerificationController", () => {
  let emailVerificationController: EmailVerificationController;
  let emailVerificationService: Mock<EmailVerificationService>;

  beforeEach(() => {
    emailVerificationService = createMock<EmailVerificationService>();
    emailVerificationController = new EmailVerificationController(emailVerificationService);
  });

  describe("resend", () => {
    it("should enqueue resend and return message", async () => {
      emailVerificationService.enqueueResendVerificationIfEligible.mockResolvedValue(undefined);

      const result = await emailVerificationController.resend({ email: "test@test.com" } as any);

      expect(
        emailVerificationService.enqueueResendVerificationIfEligible,
      ).toHaveBeenCalledWith("test@test.com");
      expect(result.message).toBeDefined();
    });
  });

  describe("confirm", () => {
    const redirectUrl = "http://localhost:3000";
    let req: Mock<Request>;
    let res: Mock<Response>;

    beforeEach(() => {
      req = createMock<Request>();
      res = createMock<Response>();
      res.redirect = vi.fn();
    });

    it("should redirect with tokens on successful confirmation", async () => {
      emailVerificationService.confirm.mockResolvedValue({
        message: "El correo se ha verificado correctamente",
        type: "session",
        token: "jwt-token",
        refresh_token: "refresh-token",
      });

      await emailVerificationController.confirm(
        { token: "valid-token", redirectUrl } as any,
        req,
        res,
      );

      expect(emailVerificationService.confirm).toHaveBeenCalledWith("valid-token", req);
      expect(res.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining("token=jwt-token"),
      );
    });

    it("should redirect to login when redirectUrl is missing", async () => {
      await emailVerificationController.confirm(
        { token: "valid-token" } as any,
        req,
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining("/iniciar-sesion"),
      );
    });

    it("should redirect to login when redirectUrl is not allowed", async () => {
      await emailVerificationController.confirm(
        { token: "valid-token", redirectUrl: "https://evil.com" } as any,
        req,
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining("/iniciar-sesion"),
      );
    });

    it("should redirect to login when service throws UnauthorizedException", async () => {
      emailVerificationService.confirm.mockRejectedValue(
        new UnauthorizedException("Token inválido"),
      );

      await emailVerificationController.confirm(
        { token: "expired-token", redirectUrl } as any,
        req,
        res,
      );

      expect(res.redirect).toHaveBeenCalledWith(
        302,
        expect.stringContaining("error=Token%20inv%C3%A1lido"),
      );
    });
  });
});
