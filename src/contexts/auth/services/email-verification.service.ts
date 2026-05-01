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
  ) { }

  async enqueueSendVerificationForUser(userId: string, email: string): Promise<void> {
    await this.emailVerificationQueue.add(EMAIL_VERIFICATION_JOB_SEND, {
      userId,
      email,
    });
  }

  /** No revela si el correo existe; solo encola cuando aplica cuenta local pendiente de verificación. */
  async enqueueResendVerificationIfEligible(email_raw: string): Promise<void> {
    const email = email_raw.trim();
    if (!email) {
      return;
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || user.provider !== "local" || user.is_email_verified) {
      this.logger.debug(
        user
          ? `Reenvío de verificación no aplicable (provider=${user.provider}, verificado=${user.is_email_verified})`
          : `Reenvío de verificación solicitado para correo no registrado`,
      );
      return;
    }

    await this.enqueueSendVerificationForUser(user.id, user.email);
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
      expiresIn: `${envs.EMAIL_VERIFICATION_TOKEN_EXPIRES_SEC}s`,
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
    let decoded: unknown;

    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException("El enlace es inválido o ya expiró");
    }

    if (decoded === null || typeof decoded !== "object") {
      throw new UnauthorizedException("Token con alcance inválido");
    }

    const o = decoded as Record<string, unknown>;
    if (
      o.scope !== "email_verification" ||
      typeof o.sub !== "string" ||
      !o.sub ||
      typeof o.email !== "string" ||
      !o.email
    ) {
      throw new UnauthorizedException("Token con alcance inválido");
    }
    return {
      sub: o.sub,
      email: o.email,
      scope: "email_verification",
    };
  }

  private buildVerificationLink(token: string): string {
    const base = envs.FRONTEND_EMAIL_VERIFICATION_URL.trim();
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}&redirectUrl=${encodeURIComponent(envs.FRONTEND_URL)}`;
  }
}
