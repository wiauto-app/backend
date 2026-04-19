import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";

import { User } from "../../users/entities/user.entity";
import { UserMailService } from "../../users/services/user-mail.service";
import {
  EMAIL_VERIFICATION_JOB_SEND,
  EMAIL_VERIFICATION_QUEUE,
  EmailVerificationJobData,
} from "../queues/email-verification.queue.constants";

export interface EmailVerificationTokenPayload {
  sub: string;
  email: string;
  scope: "email_verification";
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMailService: UserMailService,
    private readonly jwtService: JwtService,
    @InjectQueue(EMAIL_VERIFICATION_QUEUE)
    private readonly emailVerificationQueue: Queue<EmailVerificationJobData>,
  ) {}

  async enqueueSendVerificationForUser(userId: string, email: string): Promise<void> {
    await this.emailVerificationQueue.add(EMAIL_VERIFICATION_JOB_SEND, {
      userId,
      email,
    });
  }

  async sendVerificationForUser(userId: string, email: string): Promise<void> {
    const base = envs.FRONTEND_EMAIL_VERIFICATION_URL.trim();
    if (!base) {
      this.logger.warn(
        "FRONTEND_EMAIL_VERIFICATION_URL vacío: no se envía correo de verificación",
      );
      return;
    }

    const payload: EmailVerificationTokenPayload = {
      sub: userId,
      email,
      scope: "email_verification",
    };

    const signOptions: JwtSignOptions = {
      expiresIn: envs.EMAIL_VERIFICATION_TOKEN_EXPIRES_SEC,
    };
    const token = this.jwtService.sign(payload, signOptions);

    const link = this.buildVerificationLink(token);
    await this.userMailService.sendEmailVerification(email, link);
  }

  async confirm(token: string): Promise<void> {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException(
        "El enlace ya no es válido para esta cuenta. Pedí un correo nuevo.",
      );
    }

    if (user.is_email_verified) {
      return;
    }

    await this.userRepository.update(user.id, { is_email_verified: true });
  }

  private verifyToken(token: string): EmailVerificationTokenPayload {
    let decoded: EmailVerificationTokenPayload;

    try {
      decoded = this.jwtService.verify<EmailVerificationTokenPayload>(token);
    } catch {
      throw new UnauthorizedException("El enlace es inválido o ya expiró");
    }

    if (!decoded || typeof decoded !== "object" || decoded.scope !== "email_verification" || !decoded.sub || !decoded.email) {
      throw new UnauthorizedException("Token con alcance inválido");
    }

    return decoded;
  }

  private buildVerificationLink(token: string): string {
    const base = envs.FRONTEND_EMAIL_VERIFICATION_URL.trim();
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}
