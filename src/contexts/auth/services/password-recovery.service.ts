import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { envs } from "@/src/common/envs";

import { OutboundMailEnqueueService } from "../../shared/mail/outbound-mail-enqueue.service";
import { UserService } from "../../users/services/user.service";
import { authResponseConfig } from "../response.config";

interface PasswordResetTokenPayload {
  sub: string;
  scope: "password_reset";
}

@Injectable()
export class PasswordRecoveryService {
  private readonly logger = new Logger(PasswordRecoveryService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {}

  async requestRecovery(email: string): Promise<void> {
    let user;
    try {
      user = await this.userService.getUserByEmail({ email });
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.debug(`Password recovery requested for unknown email: ${email}`);
        return;
      }
      throw error;
    }

    if (user.provider !== "local") {
      this.logger.debug(`Password recovery requested for non-local email: ${email}`);
      return;
    }

    const payload: PasswordResetTokenPayload = {
      sub: user.id,
      scope: "password_reset",
    };

    const token = this.jwtService.sign(payload, {
      expiresIn: Number(envs.PASSWORD_RESET_TOKEN_EXPIRES_IN),
    });

    const link = this.buildRecoveryLink(token);
    await this.outbound_mail_enqueue_service.enqueue_password_recovery({
      to: user.email,
      recovery_link: link,
    });
  }

  async changePassword(token: string, newPassword: string): Promise<void> {
    const payload = this.verifyResetToken(token);
    await this.userService.resetPassword(payload.sub, newPassword);
  }

  private verifyResetToken(token: string): PasswordResetTokenPayload {
    let decoded: PasswordResetTokenPayload;

    try {
      decoded = this.jwtService.verify<PasswordResetTokenPayload>(token);
    } catch {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    if (!decoded.sub) {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    return decoded;
  }

  private buildRecoveryLink(token: string): string {
    const base = envs.FRONTEND_PASSWORD_RESET_URL;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}
