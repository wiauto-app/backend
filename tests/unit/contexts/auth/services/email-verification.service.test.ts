import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Queue } from "bullmq";
import { Repository } from "typeorm";

import { createMock, Mock } from "@/tests/utils/mock";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";
import { UserMailService } from "@/contexts/users/services/user-mail.service";
import { AuthSessionService } from "@/contexts/auth/services/auth-session.service";
import { User } from "@/contexts/users/entities/user.entity";

describe("EmailVerificationService", () => {
  let emailVerificationService: EmailVerificationService;
  let userRepository: Mock<Repository<User>>;
  let userMailService: Mock<UserMailService>;
  let jwtService: Mock<JwtService>;
  let authSessionService: Mock<AuthSessionService>;
  let emailVerificationQueue: Mock<Queue>;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    provider: "local",
    is_email_verified: false,
  } as any;

  beforeEach(() => {
    userRepository = createMock<Repository<User>>();
    userMailService = createMock<UserMailService>();
    jwtService = createMock<JwtService>();
    authSessionService = createMock<AuthSessionService>();
    emailVerificationQueue = createMock<Queue>();

    emailVerificationService = new EmailVerificationService(
      userRepository,
      userMailService,
      jwtService,
      authSessionService,
      emailVerificationQueue,
    );
  });

  describe("enqueueSendVerificationForUser", () => {
    it("should add a job to the queue", async () => {
      emailVerificationQueue.add.mockResolvedValue({ id: "job-1" } as any);

      await emailVerificationService.enqueueSendVerificationForUser("user-1", "test@test.com");

      expect(emailVerificationQueue.add).toHaveBeenCalledWith("send", {
        userId: "user-1",
        email: "test@test.com",
      });
    });
  });

  describe("enqueueResendVerificationIfEligible", () => {
    it("should enqueue if user is local and not verified", async () => {
      userRepository.findOne.mockResolvedValue(mockUser);
      emailVerificationQueue.add.mockResolvedValue({ id: "job-1" } as any);

      await emailVerificationService.enqueueResendVerificationIfEligible("test@example.com");

      expect(emailVerificationQueue.add).toHaveBeenCalled();
    });

    it("should not enqueue if user does not exist", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await emailVerificationService.enqueueResendVerificationIfEligible("unknown@test.com");

      expect(emailVerificationQueue.add).not.toHaveBeenCalled();
    });

    it("should not enqueue if user is already verified", async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, is_email_verified: true });

      await emailVerificationService.enqueueResendVerificationIfEligible("test@example.com");

      expect(emailVerificationQueue.add).not.toHaveBeenCalled();
    });

    it("should not enqueue if user provider is not local", async () => {
      userRepository.findOne.mockResolvedValue({ ...mockUser, provider: "google" });

      await emailVerificationService.enqueueResendVerificationIfEligible("test@example.com");

      expect(emailVerificationQueue.add).not.toHaveBeenCalled();
    });

    it("should do nothing for empty email", async () => {
      await emailVerificationService.enqueueResendVerificationIfEligible("");

      expect(userRepository.findOne).not.toHaveBeenCalled();
    });
  });

  describe("confirm", () => {
    it("should confirm email verification and return session", async () => {
      const token = "valid-token";
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        email: "test@example.com",
        scope: "email_verification",
      });
      userRepository.findOne.mockResolvedValue(mockUser);
      userRepository.preload.mockResolvedValue({ ...mockUser, is_email_verified: true });
      userRepository.save.mockResolvedValue({ ...mockUser, is_email_verified: true });
      authSessionService.establishSessionForUser.mockResolvedValue({
        type: "session",
        token: "jwt",
        refresh_token: "refresh",
      });

      const result = await emailVerificationService.confirm(token, {} as any);

      expect(result.message).toBe("El correo se ha verificado correctamente");
      expect(result.token).toBe("jwt");
    });

    it("should handle already verified user", async () => {
      const verifiedUser = { ...mockUser, is_email_verified: true };
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        email: "test@example.com",
        scope: "email_verification",
      });
      userRepository.findOne.mockResolvedValue(verifiedUser);
      authSessionService.establishSessionForUser.mockResolvedValue({
        type: "session",
        token: "jwt",
        refresh_token: "refresh",
      });

      const result = await emailVerificationService.confirm("token", {} as any);

      expect(result.message).toBe("El correo ya está verificado");
    });

    it("should throw if token is invalid", async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error("expired");
      });

      await expect(
        emailVerificationService.confirm("bad-token", {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user does not match token", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        email: "different@example.com",
        scope: "email_verification",
      });
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        emailVerificationService.confirm("token", {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw if user is not found", async () => {
      jwtService.verify.mockReturnValue({
        sub: "user-1",
        email: "test@example.com",
        scope: "email_verification",
      });
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        emailVerificationService.confirm("token", {} as any),
      ).rejects.toThrow(UnauthorizedException);
    });

  });

  describe("sendVerificationForUser", () => {
    it("should send verification email", async () => {
      jwtService.sign.mockReturnValue("verification-token");
      userMailService.sendEmailVerification.mockResolvedValue(undefined);

      await emailVerificationService.sendVerificationForUser(
        "user-1",
        "test@example.com",
      );

      expect(jwtService.sign).toHaveBeenCalled();
      expect(userMailService.sendEmailVerification).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining("verification-token"),
      );
    });
  });
});
