import { Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

import { UserService } from "../../users/services/user.service";
import { LoginDto } from "../dto/login.dto";
import { SignInResult } from "../types/auth.types";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { SuspensionService } from "../../users/services/suspension.service";

@Injectable()
export class AdminLoginService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly suspensionService: SuspensionService,
    private readonly authService: AuthService,
  ) {}

  async signIn({
    adminLoginDto,
    request,
  }: {
    adminLoginDto: LoginDto;
    request: Request;
  }): Promise<SignInResult> {
    const user = await this.userService.findOneByEmailWithPasswordAndProfileRole(
      adminLoginDto.email,
    );

    if (user.provider !== "local" || !user.password) {
      throw new UnauthorizedException("El email o la contraseña son incorrectos");
    }

    const is_valid_password = await this.passwordService.comparePassword(
      adminLoginDto.password,
      user.password,
    );
    if (!is_valid_password) {
      throw new UnauthorizedException("El email o la contraseña son incorrectos");
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException("El email no está verificado");
    }

    if (user.is_suspended) {
      throw new UnauthorizedException("El usuario está suspendido");
    }

    const role = user.profile.role;
    if (!role || (!role.is_admin && !role.is_developer)) {
      throw new UnauthorizedException(
        "No tenés permisos para acceder al panel de administración",
      );
    }

    const { session_id, refreshToken_hash } = await this.authService.createSession(
      user,
      request,
    );
    await this.suspensionService.assert_session_allowed_by_id(user.id);

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.authService.createToken({ user, session_id });

    return { type, token, refreshToken_hash };
  }

  async logout(request: Request) {
    await this.authService.logout(request);
  }
}
