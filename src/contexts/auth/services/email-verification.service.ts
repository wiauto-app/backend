import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { JwtService, JwtSignOptions } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Request } from "express";
import { Repository } from "typeorm";

import { envs } from "@/src/common/envs";

import { User } from "../../users/entities/user.entity";
import { UserMailService } from "../../users/services/user-mail.service";
import {
  EMAIL_VERIFICATION_JOB_SEND,
  EMAIL_VERIFICATION_QUEUE,
  EmailVerificationJobData,
} from "../queues/email-verification.queue.constants";
import { authResponseConfig } from "../response.config";
import { SignInResult } from "../types/auth.types";
import { AuthSessionService } from "./auth-session.service";

export interface EmailVerificationTokenPayload {
  sub: string;
  email: string;
  scope: "email_verification";
}

export type EmailVerificationConfirmResult = SignInResult & { message: string };

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMailService: UserMailService,
    private readonly jwtService: JwtService,
    private readonly authSessionService: AuthSessionService,
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
    const backendUrl = envs.BACKEND_URL.trim();
    const redirectUrl = envs.FRONTEND_REDIRECT_URL.trim();
    if (!backendUrl || !redirectUrl) {
      this.logger.warn(
        "BACKEND_URL o FRONTEND_REDIRECT_URL vacíos: no se envía correo de verificación",
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

  async confirm(token: string, request: Request): Promise<EmailVerificationConfirmResult> {
    const payload = this.verifyToken(token);
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user || user.email !== payload.email) {
      throw new UnauthorizedException(
        authResponseConfig.messages.EMAIL_VERIFICATION_ERROR,
      );
    }

    let message: string;
    if (user.is_email_verified) {
      message = authResponseConfig.messages.EMAIL_ALREADY_VERIFIED;
    } else {
      const updated = await this.userRepository.preload({
        id: user.id,
        is_email_verified: true,
      });
      if (!updated) {
        throw new UnauthorizedException(
          authResponseConfig.messages.EMAIL_VERIFICATION_ERROR,
        );
      }
      await this.userRepository.save(updated);
      user.is_email_verified = true;
      message = authResponseConfig.messages.EMAIL_VERIFIED;
    }

    const session: SignInResult = await this.authSessionService.establishSessionForUser(
      user,
      request,
    );

    return {
      message,
      type: session.type,
      token: session.token,
      refresh_token: session.refresh_token,
    };
  }

  private verifyToken(token: string): EmailVerificationTokenPayload {
    let decoded: unknown;

    try {
      decoded = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException(authResponseConfig.messages.EMAIL_VERIFICATION_EXPIRED);
    }

    if (decoded === null || typeof decoded !== "object") {
      throw new UnauthorizedException(authResponseConfig.messages.EMAIL_VERIFICATION_ERROR);
    }

    const o = decoded as Record<string, unknown>;
    if (
      o.scope !== "email_verification" ||
      typeof o.sub !== "string" ||
      !o.sub ||
      typeof o.email !== "string" ||
      !o.email
    ) {
      throw new UnauthorizedException(authResponseConfig.messages.EMAIL_VERIFICATION_ERROR);
    }
    return {
      sub: o.sub,
      email: o.email,
      scope: "email_verification",
    };
  }

  private buildVerificationLink(token: string): string {
    const base = `${envs.BACKEND_URL.replace(/\/$/, "")}/auth/email-verification/confirm`;
    return `${base}?token=${encodeURIComponent(token)}&redirectUrl=${encodeURIComponent(envs.FRONTEND_REDIRECT_URL)}`;
  }
}
