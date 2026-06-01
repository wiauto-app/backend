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
  scope: "password_reset" | "password_reset_admin";
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

    const token = this.sign_reset_token({
      sub: user.id,
      scope: "password_reset",
    });

    const link = this.buildRecoveryLink(token);
    await this.outbound_mail_enqueue_service.enqueue_password_recovery({
      to: user.email,
      recovery_link: link,
    });
  }

  async changePassword(token: string, newPassword: string): Promise<void> {
    const payload = this.verify_reset_token(token);
    if (payload.scope !== "password_reset") {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }
    await this.userService.resetPassword(payload.sub, newPassword);
  }

  async requestAdminRecovery(email: string): Promise<void> {
    let user;
    try {
      user = await this.userService.findOneByEmailWithPasswordAndProfileRole(email);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.debug(`Admin password recovery requested for unknown email: ${email}`);
        return;
      }
      throw error;
    }

    if (user.provider !== "local" || !user.profile.role) {
      this.logger.debug(`Admin password recovery requested for invalid account: ${email}`);
      return;
    }

    if (!user.profile.role.is_admin && !user.profile.role.is_developer) {
      this.logger.debug(`Admin password recovery requested for non-admin email: ${email}`);
      return;
    }

    const token = this.sign_reset_token({
      sub: user.id,
      scope: "password_reset_admin",
    });

    const link = this.buildRecoveryLink(token);
    await this.outbound_mail_enqueue_service.enqueue_password_recovery({
      to: user.email,
      recovery_link: link,
    });
  }

  async changeAdminPassword(token: string, newPassword: string): Promise<void> {
    const payload = this.verify_reset_token(token);
    if (payload.scope !== "password_reset_admin") {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_TOKEN);
    }

    const user = await this.userService.findOne(payload.sub);
    const role = user.profile.role;
    if (
      user.provider !== "local" ||
      !role ||
      (!role.is_admin && !role.is_developer)
    ) {
      throw new UnauthorizedException(authResponseConfig.messages.NO_ADMIN);
    }

    await this.userService.resetPassword(payload.sub, newPassword);
  }

  private verify_reset_token(token: string): PasswordResetTokenPayload {
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

  private sign_reset_token(payload: PasswordResetTokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: Number(envs.PASSWORD_RESET_TOKEN_EXPIRES_IN),
    });
  }

  private buildRecoveryLink(token: string): string {
    const base = envs.FRONTEND_PASSWORD_RESET_URL;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}
