import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { envs } from "@/src/common/envs";

import { MailService } from "../../shared/mail/mail.service";
import { UserService } from "../../users/services/user.service";

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
    private readonly mailService: MailService,
  ) {}

  async requestRecovery(email: string): Promise<void> {
    const user = await this.userService.getUserByEmail({ email });

    if (!user || user.provider !== "local") {
      this.logger.debug(`Password recovery requested for unknown or non-local email: ${email}`);
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
    await this.mailService.sendPasswordRecoveryEmail(user.email, link);
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
      throw new UnauthorizedException("El enlace es inválido o ya expiró");
    }

    if (!decoded.sub) {
      throw new UnauthorizedException("Token con alcance inválido");
    }

    return decoded;
  }

  private buildRecoveryLink(token: string): string {
    const base = envs.FRONTEND_PASSWORD_RESET_URL;
    const separator = base.includes("?") ? "&" : "?";
    return `${base}${separator}token=${encodeURIComponent(token)}`;
  }
}
