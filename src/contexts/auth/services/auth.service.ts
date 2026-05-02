import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { UserService } from "../../users/services/user.service";
import { PasswordService } from "./password.service";
import { LoginDto } from "../dto/login.dto";
import { User } from "../../users/entities/user.entity";
import { OAuthProfile } from "../strategies/google.strategy";
import { SessionPayload, SignInResult } from "../types/auth.types";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) { }

  async signIn(loginDto: LoginDto): Promise<SignInResult> {
    const user = await this.userService.findOneByEmailWithPassword(loginDto.email);
    if (user.provider !== "local" || !user.password) {
      throw new UnauthorizedException(
        `Este email está registrado con ${user.provider}. Iniciá sesión con ese proveedor.`,
      );
    }

    const isValidPassword = await this.passwordService.comparePassword(loginDto.password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException("El email o la contraseña son incorrectos");
    }

    if (!user.is_email_verified) {
      throw new UnauthorizedException(
        "Debés verificar tu correo antes de iniciar sesión. Revisá tu bandeja de entrada o solicitá un nuevo enlace desde la app.",
      );
    }

    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    const type = user.two_factor_enabled ? "2fa_challenge" : "session";
    const token = this.createToken({ ...user, type }, "30d");

    return { type, token }

  }

  async signInWithOAuthProfile(profile: OAuthProfile) {
    if (!profile.email) {
      throw new UnauthorizedException("El proveedor no devolvió un email");
    }

    const user = await this.userService.findOrCreateOAuthUser(profile);
    await this.userService.update(user.id, {
      last_sign_in: new Date(),
    });

    return this.createToken({ ...user, type: "session" });
  }

  createToken(user: User & { type: "session" | "2fa_challenge", password?: string | null }, expiresIn: "30d" | "300s" = "30d") {
    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      scope: user.two_factor_enabled ? "2fa_challenge" : "session"
    };
    return this.jwtService.sign(payload,
      { expiresIn },
    );
  }
}
