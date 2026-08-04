import { JwtService } from "@nestjs/jwt";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { Request } from "express";

import { createMock, Mock } from "@/tests/utils/mock";
import { EmailVerificationService } from "@/contexts/auth/services/email-verification.service";
import { AuthSessionService } from "@/contexts/auth/services/auth-session.service";
import { AuthSecurityMailService } from "@/contexts/auth/services/auth-security-mail.service";
import { UserMailService } from "@/contexts/users/services/user-mail.service";
import { User } from "@/contexts/users/entities/user.entity";
import { EmailVerificationJobData } from "@/contexts/auth/queues/email-verification.queue.constants";

describe("EmailVerificationService.confirm (welcome mail)", () => {
  let service: EmailVerificationService;
  let userRepository: Mock<Repository<User>>;
  let userMailService: Mock<UserMailService>;
  let jwtService: Mock<JwtService>;
  let authSessionService: Mock<AuthSessionService>;
  let authSecurityMailService: Mock<AuthSecurityMailService>;
  let emailVerificationQueue: Mock<Queue<EmailVerificationJobData>>;

  const request = { ip: "1.1.1.1", headers: {} } as Request;

  beforeEach(() => {
    userRepository = createMock<Repository<User>>();
    userMailService = createMock<UserMailService>();
    jwtService = createMock<JwtService>();
    authSessionService = createMock<AuthSessionService>();
    authSecurityMailService = createMock<AuthSecurityMailService>();
    emailVerificationQueue = createMock<Queue<EmailVerificationJobData>>();

    service = new EmailVerificationService(
      userRepository,
      userMailService,
      jwtService,
      authSessionService,
      authSecurityMailService,
      emailVerificationQueue,
    );

    authSessionService.establishSessionForUser.mockResolvedValue({
      type: "session",
      token: "access",
      refresh_token: "refresh",
    });
  });

  it("enqueues welcome on first verification and does not enqueue new_login here", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      is_email_verified: false,
      last_sign_in: null,
      profile: { name: "Ada" },
    } as User;

    jwtService.verify.mockReturnValue({
      sub: user.id,
      email: user.email,
      scope: "email_verification",
    });
    userRepository.findOne.mockResolvedValue(user);
    userRepository.preload.mockResolvedValue({
      ...user,
      is_email_verified: true,
    } as User);
    userRepository.save.mockResolvedValue({
      ...user,
      is_email_verified: true,
    } as User);

    await service.confirm("token", request);

    expect(authSecurityMailService.enqueueUserWelcome).toHaveBeenCalledWith({
      to: user.email,
      name: "Ada",
    });
    expect(authSecurityMailService.enqueueNewLogin).not.toHaveBeenCalled();
    expect(authSessionService.establishSessionForUser).toHaveBeenCalled();
  });

  it("does not enqueue welcome when email was already verified", async () => {
    const user = {
      id: "user-1",
      email: "user@example.com",
      is_email_verified: true,
      last_sign_in: new Date("2026-01-01"),
      profile: { name: "Ada" },
    } as User;

    jwtService.verify.mockReturnValue({
      sub: user.id,
      email: user.email,
      scope: "email_verification",
    });
    userRepository.findOne.mockResolvedValue(user);

    await service.confirm("token", request);

    expect(authSecurityMailService.enqueueUserWelcome).not.toHaveBeenCalled();
    expect(userRepository.preload).not.toHaveBeenCalled();
  });
});
