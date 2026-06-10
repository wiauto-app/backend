import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { UserService } from "../../users/services/user.service";
import { LoginDto } from "../dto/login.dto";
import { SignInResult } from "../types/auth.types";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SuspensionService } from "../../users/services/suspension.service";
import { authResponseConfig } from "../response.config";

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly suspensionService: SuspensionService,
    private readonly authService: AuthService,
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

    const role = user.profile.role;
    if (!role || (!role.is_admin && !role.is_developer)) {
      throw new UnauthorizedException(
        authResponseConfig.messages.NO_ADMIN,
      );
    }

    await this.suspensionService.assert_session_allowed_by_id(user.id);

    const { session_id, refresh_token, refresh_token_hash } = await this.authService.createSession(
      user,
      request,
    );

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.authService.createToken({ user, session_id, refresh_token_hash });

    return { type, token, refresh_token };
  }

  async logout(session_id: string) {
    await this.authService.logout(session_id);
  }
}
