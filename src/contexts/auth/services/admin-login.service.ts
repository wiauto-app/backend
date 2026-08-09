import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { UserService } from "../../users/services/user.service";
import { LoginDto } from "../dto/login.dto";
import { SignInResult } from "../types/auth.types";
import { AuthSecurityMailService } from "./auth-security-mail.service";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SuspensionService } from "../../users/services/suspension.service";
import { authResponseConfig } from "../response.config";
import { normalizeUserAgent } from "../utils/normalize-user-agent";

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly suspensionService: SuspensionService,
    private readonly authService: AuthService,
    private readonly authSecurityMailService: AuthSecurityMailService,
  ) { }

  async signIn({
    adminLoginDto,
    request,
  }: {
    adminLoginDto: LoginDto;
    request: Request;
  }): Promise<SignInResult> {
    const user = await this.userService.findOneByEmailWithPassword(
      adminLoginDto.email,
    );
    if (!user.password) {
      throw new UnauthorizedException(authResponseConfig.messages.DIFFERENT_PROVIDER);
    }

    const is_valid_password = await this.passwordService.comparePassword(
      adminLoginDto.password,
      user.password,
    );
    if (!is_valid_password) {
      throw new UnauthorizedException(authResponseConfig.messages.INVALID_CREDENTIALS);
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException(authResponseConfig.messages.EMAIL_NOT_VERIFIED);
    }

    if (user.is_suspended) {
      throw new UnauthorizedException(authResponseConfig.messages.USER_SUSPENDED);
    }

    if (!user.is_admin) {
      throw new UnauthorizedException(
        authResponseConfig.messages.NO_ADMIN,
      );
    }

    await this.suspensionService.assert_session_allowed_by_id(user.id);

    const previous_last_sign_in = user.last_sign_in;
    const notify_new_login = !!previous_last_sign_in;

    const { session_id, refresh_token_hash } = await this.authService.createSession(
      user,
      request,
    );

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.authService.createToken({
      user,
      session_id,
      refresh_token_hash,
      notify_new_login: type === "2fa_challenge" ? notify_new_login : undefined,
    });

    if (type === "session" ) {
      this.authSecurityMailService.enqueueNewLogin({
        to: user.email,
        ip_address: request.ip ?? null,
        user_agent: normalizeUserAgent(
          request.headers["user-agent"],
        ),
        audience: "admin",
      });
    }

    return { type, token, refresh_token:refresh_token_hash };
  }

  async logout(session_id: string) {
    await this.authService.logout(session_id);
  }

  async refresh(refresh_token: string): Promise<SignInResult> {
    return this.authService.refreshToken(refresh_token);
  }
}
